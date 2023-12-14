import Visualization from "./Visualization";

export default function Funding() {
  return (
    <>
      <div className="d-flex flex-column justify-content-stretch pt-2">
        <p className="d-flex fs-3 text-primary mb-0">
          Streaming Quadratic Funding
        </p>
        <p className="text-white fs-4 mb-1">
          A quadratic funding round every second
        </p>
        <p className="text-info fs-5 mb-0">
          Beta Run - January 15 - April 15, 2024
        </p>
      </div>
      <Visualization />
    </>
  );
}
