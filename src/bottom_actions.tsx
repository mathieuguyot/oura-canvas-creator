type BottomActionsProps = {
    onSave: () => void;
    onLoad: (evt: any) => void;
    onReset: () => void;
};

const buttonStyle = "input bg-primary btn-secondary input-xs focus:outline-0";

export default function BottomActions({ onSave, onLoad, onReset }: BottomActionsProps) {
    return (
        <>
            <button
                onClick={onSave}
                className={buttonStyle}
                style={{ position: "absolute", left: 5, bottom: 5 }}
            >
                save
            </button>
            <label
                htmlFor="files"
                className={buttonStyle}
                style={{ position: "absolute", left: 55, bottom: 5 }}
            >
                load
            </label>
            <input onChange={onLoad} id="files" style={{ visibility: "hidden" }} type="file" />
            <button
                onClick={onReset}
                className={buttonStyle}
                style={{ position: "absolute", right: 5, bottom: 5 }}
            >
                reset
            </button>
        </>
    );
}
