"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

export type PortalSearchRegistration = {
  enabled: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
};

type PortalSearchContextValue = {
  registration: PortalSearchRegistration | null;
  register: (registration: PortalSearchRegistration | null) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  focusSearch: () => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
};

const PortalSearchContext = createContext<PortalSearchContextValue | null>(null);

function portalSearchEqual(
  a: PortalSearchRegistration | null,
  b: PortalSearchRegistration | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.enabled === b.enabled &&
    a.placeholder === b.placeholder &&
    a.value === b.value &&
    a.onChange === b.onChange
  );
}

export function PortalSearchProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<PortalSearchRegistration | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const register = useCallback((next: PortalSearchRegistration | null) => {
    setRegistration((prev) => (portalSearchEqual(prev, next) ? prev : next));
  }, []);

  const focusSearch = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const value = useMemo(
    () => ({
      registration,
      register,
      inputRef,
      focusSearch,
      commandOpen,
      setCommandOpen,
    }),
    [registration, register, focusSearch, commandOpen],
  );

  return <PortalSearchContext.Provider value={value}>{children}</PortalSearchContext.Provider>;
}

export function usePortalSearchContext() {
  const ctx = useContext(PortalSearchContext);
  if (!ctx) {
    throw new Error("usePortalSearchContext must be used within PortalSearchProvider");
  }
  return ctx;
}

export function useRegisterPortalSearch(config: PortalSearchRegistration | null) {
  const { register } = usePortalSearchContext();
  const enabled = config?.enabled;
  const placeholder = config?.placeholder;
  const value = config?.value;
  const onChange = config?.onChange;

  const registration = useMemo((): PortalSearchRegistration | null => {
    if (enabled === undefined || value === undefined || !onChange) {
      return null;
    }
    return { enabled, placeholder, value, onChange };
  }, [enabled, placeholder, value, onChange]);

  useEffect(() => {
    register(registration);
    return () => register(null);
  }, [register, registration]);
}
