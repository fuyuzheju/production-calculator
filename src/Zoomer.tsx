import "./Zoomer.css"

interface Props {
    scale: number;
    setScale: ((updater: (prev: number) => number) => void) & ((scale: number) => void);
}

function Zoomer({ scale, setScale }: Props) {
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0)); // 最大 200%
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.2)); // 最小 20%
    const handleZoomReset = () => setScale(1);

    const scalePercent = Math.round(scale * 100) + '%';
    return (
        <div className="zoom-controls" onClick={(e)=>e.stopPropagation()}>
            <button className="zoom-btn" onClick={handleZoomOut} title="缩小">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
            <span className="zoom-level" onClick={handleZoomReset} title="点击重置">
                {scalePercent}
            </span>
            <button className="zoom-btn" onClick={handleZoomIn} title="放大">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        </div>
    )
}

export default Zoomer;