export type BlockName = 'North' | 'Second' | 'Third' | 'South';
export type FloorName = 'Ground' | '1st' | '2nd' | '3rd' | 'Roof';

export const FLOORS: FloorName[] = ['Ground', '1st', '2nd', '3rd', 'Roof'];
export const BLOCKS_TOP_TO_BOTTOM: BlockName[] = ['North', 'Second', 'Third', 'South'];
export const MAINTENANCE_FEE = 2000;

export type Side = 'right' | 'left';

export interface Apartment {
    apt_number: string;
    floor: FloorName;
    block: BlockName;
    side: Side;
    is_gate?: boolean;
    resident_name?: string | null;
    resident_phone?: string | null;
    owner_name?: string | null;
    is_rented: boolean;
    has_paid: boolean;
    updated_at?: string;
}

function pad(n: number): string {
    return n.toString().padStart(3, '0');
}

// Right column numbers from North (top) to South (bottom), left column from South (bottom) back up to North (top).
function standardFloorSlots(floor: FloorName, prefix: number, hasGate = false): Apartment[] {
    const slots: Apartment[] = [];

    BLOCKS_TOP_TO_BOTTOM.forEach((block, i) => {
        slots.push(makeApt(pad(prefix + i * 2 + 1), floor, block, 'right'));
        slots.push(makeApt(pad(prefix + i * 2 + 2), floor, block, 'right'));
    });

    const leftOrder = [...BLOCKS_TOP_TO_BOTTOM].reverse(); // South, Third, Second, North
    leftOrder.forEach((block, j) => {
        const first = prefix + 8 + j * 2 + 1;
        const second = prefix + 8 + j * 2 + 2;
        slots.push(makeApt(pad(first), floor, block, 'left'));
        if (hasGate && block === 'North' && j === leftOrder.length - 1) {
            slots.push({ ...makeApt('GATE', floor, block, 'left'), is_gate: true });
        } else {
            slots.push(makeApt(pad(second), floor, block, 'left'));
        }
    });

    return slots;
}

function makeApt(apt_number: string, floor: FloorName, block: BlockName, side: Side): Apartment {
    return { apt_number, floor, block, side, is_rented: false, has_paid: false };
}

/** Full building layout (67 residential slots + 1 gate slot), used both to seed the DB and to lay out the UI. */
export function generateBuildingLayout(): Apartment[] {
    return [
        ...standardFloorSlots('Ground', 0, true),
        ...standardFloorSlots('1st', 100),
        ...standardFloorSlots('2nd', 200),
        ...standardFloorSlots('3rd', 300),
        // Roof only exists above the two middle blocks, left side only.
        makeApt('411', 'Roof', 'Third', 'left'),
        makeApt('412', 'Roof', 'Third', 'left'),
        makeApt('413', 'Roof', 'Second', 'left'),
        makeApt('414', 'Roof', 'Second', 'left'),
    ];
}
