// 引入 Tauri 的 API
import { writeTextFile, open } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { listen } from "@tauri-apps/api/event";
import type { ProjectData } from './data';
import { phaseViewRecover, ProjectDataSchema } from './data';
import { invoke } from '@tauri-apps/api/core';

export const isTauri = ('__TAURI_INTERNALS__' in window)

export const saveData = async (data: any, suggestedName: string): Promise<boolean> => {
    const jsonString = JSON.stringify(data, null, 2);

    if (isTauri) {
        try {
            // 打开原生的保存对话框
            const filePath = await save({
                defaultPath: suggestedName.endsWith('.prod') ? suggestedName : `${suggestedName}.prod`,
                filters: [{
                    name: 'PROD Files',
                    extensions: ['prod'] // 这里指定扩展名为 .prod
                }]
            });

            // 如果用户取消了保存，filePath 会是 null
            if (!filePath) return false;

            // 调用 Tauri 的 fs API 写入文件
            await writeTextFile(filePath, jsonString);
            return true;
        } catch (err) {
            console.error('Tauri save failed:', err);
            return false;
        }
    }

    // ============================================================
    // 2. 普通浏览器的处理逻辑 (之前的代码)
    // ============================================================

    if ('showSaveFilePicker' in window) {
        try {
            const options = {
                suggestedName: suggestedName,
                types: [
                    {
                        description: 'PROD Files',
                        accept: { 'application/json': ['.prod'] },
                    },
                ],
            };
            // @ts-expect-error: new API
            const fileHandle = await window.showSaveFilePicker(options);
            const writable = await fileHandle.createWritable();
            await writable.write(jsonString);
            await writable.close();
            return true;
        } catch (err: any) {
            if (err.name === 'AbortError') return false;
            console.warn('Web FS API failed, using fallback.');
        }
    }

    // Fallback for older browsers
    let fileName = prompt('请输入文件名', suggestedName);
    if (!fileName) return false;
    if (!fileName.endsWith('.prod')) fileName += '.prod';

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
}

export const getPendingProjects: () => Promise<ProjectData[]> = async () => {
    if (!isTauri) return [];

    const paths = await invoke("get_pending_files");

    const promises = (paths as string[]).map(async function (path) {
        try {
            const file = await open(path);
            const stat = await file.stat();
            const buf = new Uint8Array(stat.size);
            await file.read(buf);
            const contents = new TextDecoder().decode(buf);
            await file.close();
            const data = JSON.parse(contents);
            const parsedData = ProjectDataSchema.parse(data);
            parsedData.phases.forEach(ph => phaseViewRecover(ph));
            return parsedData;
        } catch (err) {
            if (err instanceof SyntaxError) {
                alert("文件格式错误");
            } else {
                alert("未知错误");
            }
        }
    });
    const results = (await Promise.all(promises)).filter(pj => pj !== undefined)
    return results;
}

export const init = async (loadProject: (data: ProjectData) => void) => {
    if (!isTauri) return () => { };
    (await getPendingProjects()).forEach(pj => loadProject(pj));
    const setupListener = async () => {
        const unlisten = await listen<string[]>('open-file', async () => {
            (await getPendingProjects()).forEach(pj => loadProject(pj));
        });

        return () => {
            unlisten();
        };
    };

    let unlistenFn: (() => void) | undefined;
    setupListener().then(fn => unlistenFn = fn);

    return () => {
        if (unlistenFn) {
            unlistenFn();
        }
    };
}