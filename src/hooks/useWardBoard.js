import { useCallback, useMemo, useState } from "react";
import { admitIncoming, initialBoard } from "@/lib/wardBoard";

export function useWardBoard() {
  const [patients, setPatients] = useState(() => initialBoard(Date.now()));
  const [incoming, setIncoming] = useState(() => []);
  const [selectedId, setSelectedId] = useState(() => patients[0]?.id);
  const selected = useMemo(
    () => patients.find((patient) => patient.id === selectedId) || patients[0],
    [patients, selectedId],
  );

  const admit = useCallback((patient) => {
    const admitted = admitIncoming(patient, Date.now());
    setPatients((current) => [...current, admitted]);
    setIncoming((current) => current.filter((item) => item.id !== patient.id));
    setSelectedId(admitted.id);
    return admitted;
  }, []);

  const discharge = useCallback((patient) => {
    setPatients((current) => current.filter((item) => item.id !== patient.id));
    setSelectedId((current) => current === patient.id ? undefined : current);
  }, []);

  return { patients, setPatients, incoming, setIncoming, selected, selectedId, setSelectedId, admit, discharge };
}
