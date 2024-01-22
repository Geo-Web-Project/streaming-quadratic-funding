import { useAlloContext } from "../context/Allo";

export default function useAllo() {
  const { alloStrategy, recipients, recipientsDetails } = useAlloContext();

  return { alloStrategy, recipients, recipientsDetails };
}
