import { SelectionItem } from "oura-node-editor";

type BottomActionsProps = {
    selectedItems: SelectionItem[];

    onSave: () => void;
    onLoad: (evt: any) => void;
    onDelete: () => void;
    onReset: () => void;
};

const buttonStyle = "input bg-primary btn-secondary input-xs focus:outline-0";

export default function BottomActions({ selectedItems, onSave, onLoad, onDelete, onReset }: BottomActionsProps) {
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
            {selectedItems.length > 0 && <label
                onClick={onDelete}
                className={buttonStyle}
                style={{ position: "absolute", left: 105, bottom: 5 }}
            >
                delete
            </label>}
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
