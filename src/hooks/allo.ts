import { useAlloContext } from "../context/Allo";

export default function useAllo() {
  const { alloStrategy, recipients, recipientsDetails, passportDecoder } = useAlloContext();

  return { alloStrategy, recipients, recipientsDetails, passportDecoder };
}
