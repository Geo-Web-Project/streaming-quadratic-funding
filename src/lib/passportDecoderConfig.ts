export const passportDecoderConfig = {
    addresses: { 84531: "0xa652BE6A92c7efbBfEEf6b67eEF10A146AAA8ADc" },
    abi: [
        {
            inputs: [{ type: "address", name: "user" }],
            name: "getScore",
            outputs: [{ type: "uint256", name: "score" }],
            stateMutability: "view",
            type: "function",
        },
    ] as const,
};
