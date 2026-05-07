// MountainContext.tsx is the shared "mountain shelf" for PEAK.
// Any page/component that needs mountain data should call useMountain().
// Example:
// const { mountains, activeMountain, createMountain, selectMountain } = useMountain()
// That means: call useMountain(), get the shared mountain object, and pull those named properties out of it.
//
// Mental model:
// - MountainProvider owns the real state and the functions that change it.
// - MountainContext.Provider makes that state/functions available to everything inside it.
// - useMountain() is the helper hook components use to read that provider value.

import React, { createContext, useCallback, useContext, useState } from "react";
import type { Route } from "../../../shared/schema";


// MountainRecord is frontend app state, not AI output.
// Route is the generated learning route. MountainRecord means:
// "PEAK saved this generated route as one mountain the learner can return to."
export type MountainRecord = {
  id: string;
  route: Route;
  // Store dates as strings because this will be localStorage-friendly.
  createdAt: string;
};

// This is the shape of the object that useMountain() returns.
// It lists what components are allowed to see and do with mountain state.
type MountainContextValue = {
  // All mountains PEAK currently knows about.
  mountains: MountainRecord[];
  // The full selected mountain object, derived from mountains + activeMountainId.
  activeMountain: MountainRecord | null;
  // Source of truth for which mountain is selected.
  activeMountainId: string | null;
  // Create a new saved mountain from a generated Route.
  // Returns the new record so callers can immediately use its id.
  createMountain: (route: Route) => MountainRecord;
  // Selects an existing mountain by id. Unknown ids are ignored.
  selectMountain: (id: string) => void;
};

// createContext creates the context object.
// The value starts as undefined because before MountainProvider wraps the app,
// there is no mountain value for useMountain() to read.
const MountainContext = createContext<MountainContextValue | undefined>(undefined);

export function useMountain(): MountainContextValue {
  // useContext is the built-in React hook.
  // useMountain is our custom wrapper for this specific context.
  const context = useContext(MountainContext);

  // This catches the common mistake where a component calls useMountain()
  // but the app was not wrapped in <MountainProvider>.
  if (!context) {
    throw new Error("useMountain must be used within a MountainProvider");
  }

  // This returned object is the same object passed into Provider's value prop.
  return context;
}

export function MountainProvider({children}: {children: React.ReactNode}) {
    // This is the actual list of saved mountains.
    const [mountains, setMountains] = useState<MountainRecord[]>([]);

    // Store the selected mountain's id, not the full mountain object.
    // The full activeMountain is derived below so it cannot drift out of sync.
    const [activeMountainId, setActiveMountainId] = useState<string | null>(null);

    // Derived value:
    // activeMountainId answers "which mountain?"
    // activeMountain answers "give me that mountain's full data."
    const activeMountain = activeMountainId
        ? mountains.find((m) => m.id === activeMountainId) ?? null
        : null;

    const createMountain = useCallback((route: Route) => {
        const newMountain: MountainRecord = {
            id: crypto.randomUUID(),
            route,
            createdAt: new Date().toISOString()
        };

        // Use the functional updater so React gives us the freshest mountain list.
        setMountains((currentMountains) => [...currentMountains, newMountain]);

        // The mountain the user just created should become the selected mountain.
        setActiveMountainId(newMountain.id);
        return newMountain;
    }, []);

    const selectMountain = useCallback((id: string) => {
        // Pages/components should not set activeMountainId directly.
        // This function protects the invariant: activeMountainId must point to a real mountain.
        const mountainExists = mountains.some((m) => m.id === id);
        if (!mountainExists) return;

        setActiveMountainId(id);
    }, [mountains]);

    return (
        // Provider is an invisible wrapper. It does not render visible UI by itself.
        // The children do the visual work; this wrapper just supplies mountain data/actions.
        <MountainContext.Provider value={{ mountains, activeMountain, activeMountainId, createMountain, selectMountain }}>
            {children}
        </MountainContext.Provider>
    )
}
