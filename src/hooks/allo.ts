import { useAlloContext } from "../context/Allo";

export default function useAllo() {
  const { alloStrategy, recipients } = useAlloContext();

  return { alloStrategy, recipients };
}
