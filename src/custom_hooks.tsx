import { NodeCollection, LinkCollection } from "oura-node-editor";
import { useEffect, useCallback } from "react";
import { createNodeFromJson } from "./nodes";
import { TaskQueue } from "./nodes/node";

export function useLocalStorage(nodes: NodeCollection, links: LinkCollection) {
    useEffect(() => {
        if (Object.keys(nodes).length > 0) {
            localStorage.setItem("nodes", JSON.stringify(nodes));
        }
    }, [nodes]);

    useEffect(() => {
        if (Object.keys(links).length > 0) {
            localStorage.setItem("links", JSON.stringify(links));
        }
    }, [links]);
}

export function useSaveLoadReset(
    nodes: NodeCollection,
    links: LinkCollection,
    setNodes: (value: React.SetStateAction<NodeCollection>) => void,
    setLinks: (value: React.SetStateAction<LinkCollection>) => void,
    setRunFirstPropagation: (value: React.SetStateAction<boolean>) => void,
    taskQueue: TaskQueue
) {
    const onSave = useCallback(() => {
        const data = {
            nodes: nodes,
            links: links
        };

        const element = document.createElement("a");
        element.setAttribute(
            "href",
            "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data))
        );
        element.setAttribute("download", "oura-node-editor.json");

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }, [nodes, links]);

    const onLoad = useCallback(
        (evt: any) => {
            taskQueue.reset();
            if (evt.target.files.size < 1) {
                return;
            }

            const reader = new FileReader();
            reader.onload = (file) => {
                if (file.target && file.target.result && file.target.result) {
                    const data = JSON.parse(atob((file.target.result as string).substring(29)));
                    Object.keys(data.nodes).forEach((key) => {
                        data.nodes[key] = createNodeFromJson(data.nodes[key], key, setNodes);
                    });
                    setNodes(data.nodes);
                    setLinks(data.links);
                    setRunFirstPropagation(true);
                }
            };
            reader.readAsDataURL(evt.target.files[0]);
        },
        [setLinks, setNodes, setRunFirstPropagation, taskQueue]
    );

    const onReset = useCallback(() => {
        taskQueue.reset();
        setNodes({});
        setLinks({});
    }, [setLinks, setNodes, taskQueue]);

    return { onSave, onLoad, onReset };
}
