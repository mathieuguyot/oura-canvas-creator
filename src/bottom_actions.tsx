type BottomActionsProps = {
    onSave: () => void;
    onLoad: (evt: any) => void;
    onReset: () => void;
};

export default function BottomActions({ onSave, onLoad, onReset }: BottomActionsProps) {
    return (
        <>
            <button
                onClick={onSave}
                className="input btn-primary input-xs focus:outline-0"
                style={{ position: "absolute", left: 5, bottom: 5 }}
            >
                save
            </button>
            <label
                htmlFor="files"
                className="input btn-primary input-xs focus:outline-0"
                style={{ position: "absolute", left: 55, bottom: 5 }}
            >
                load
            </label>
            <input onChange={onLoad} id="files" style={{ visibility: "hidden" }} type="file" />
            <button
                onClick={onReset}
                className="input btn-primary input-xs focus:outline-0"
                style={{ position: "absolute", right: 5, bottom: 5 }}
            >
                reset
            </button>
        </>
    );
}
