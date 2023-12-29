import { useState, useEffect } from "react";

const ANIMATION_MINIMUM_STEP_TIME = 100;

export default function useSuperTokenBalance(
  startingBalance: bigint,
  startingTimestamp: number,
  flowRate: bigint
) {
  const [superTokenBalance, setSuperTokenBalance] = useState(startingBalance);

  useEffect(() => {
    if (flowRate === BigInt(0)) {
      return;
    }

    let lastAnimationTimestamp: DOMHighResTimeStamp = 0;

    const animationStep = (currentAnimationTimestamp: DOMHighResTimeStamp) => {
      animationFrameId = window.requestAnimationFrame(animationStep);

      if (
        currentAnimationTimestamp - lastAnimationTimestamp >
        ANIMATION_MINIMUM_STEP_TIME
      ) {
        lastAnimationTimestamp = currentAnimationTimestamp;

        const elapsedTimeInMilliseconds = BigInt(
          Date.now() - startingTimestamp * 1000
        );
        const superTokenBalance =
          startingBalance +
          (flowRate * elapsedTimeInMilliseconds) / BigInt(1000);

        setSuperTokenBalance(superTokenBalance);
      }
    };

    let animationFrameId = window.requestAnimationFrame(animationStep);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [startingBalance, startingTimestamp, flowRate]);

  return superTokenBalance;
}
