import { createSignal } from "solid-js";

export interface FloorDef {
    id: number;
    name: string;
    nameEn: string;
}

export const FLOORS: FloorDef[] = [
    { id: 0, name: "Фрейминг", nameEn: "Framing" },
    { id: 1, name: "Планирование", nameEn: "Planning" },
    { id: 2, name: "Сырые данные", nameEn: "Raw Data" },
    { id: 3, name: "Инсайты", nameEn: "Insights" },
    { id: 4, name: "Артефакты", nameEn: "Artifacts" },
    { id: 5, name: "Блокнот", nameEn: "Notebook" },
];

export function useFloor() {
    const [currentFloor, setCurrentFloor] = createSignal(0);
    const [currentBranch, setCurrentBranch] = createSignal("Branch 1");
    const [branches, setBranches] = createSignal<string[]>([
        "Branch 1",
        "Branch 2",
        "Branch 3",
        "Branch 4",
        "Branch 5",
    ]);

    const floorName = () => FLOORS[currentFloor()]?.name ?? "";
    const floorNameEn = () => FLOORS[currentFloor()]?.nameEn ?? "";

    const floorUp = () => {
        const next = Math.min(currentFloor() + 1, FLOORS.length - 1);
        if (next !== currentFloor()) goToFloor(next);
    };

    const floorDown = () => {
        const next = Math.max(currentFloor() - 1, 0);
        if (next !== currentFloor()) goToFloor(next);
    };

    const goToFloor = (id: number) => {
        if (id < 0 || id >= FLOORS.length) return;
        setCurrentFloor(id);
    };

    const createBranch = (): string => {
        const existing = branches();
        const num = existing.length + 1;
        const name = `Branch ${num}`;
        setBranches([...existing, name]);
        setCurrentBranch(name);
        setCurrentFloor(0);
        return name;
    };

    const switchBranch = (name: string) => {
        if (branches().includes(name)) {
            setCurrentBranch(name);
            setCurrentFloor(0);
        }
    };

    return {
        currentFloor,
        setCurrentFloor,
        currentBranch,
        setCurrentBranch,
        branches,
        floorName,
        floorNameEn,
        floorUp,
        floorDown,
        goToFloor,
        createBranch,
        switchBranch,
        FLOORS,
    };
}
