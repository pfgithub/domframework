"dmf prefix $";

import { React, ListRender, $, $bind, List, mount } from "dmf";

$;
React;

// ---

type ResourcesSpec = List<{ resource: string; cost: string }>;

type ClickerSpecItem =
    | { type: "none" }
    | { type: "spacer" }
    | { type: "separator" }
    | { type: "counter"; name: string; description: string }
    | {
          type: "button";
          data: {
              name: string;
              price?: ResourcesSpec;
              requirements?: ResourcesSpec;
              effects?: ResourcesSpec;
          };
      };

function SelectList<T>(choices: [string, T][], $value: T) {
    let choiceDataMap = new Map<string, T>();
    let currentChoice = choices[0][0];
    return (
        <span>
            {choices.map(([a, b]) => (
                <button
                    onClick={() => {
                        choiceDataMap.set(currentChoice, $value);
                        currentChoice = a;
                        if (choiceDataMap.has(a)) {
                            $value = choiceDataMap.get(a)!;
                        } else {
                            $value = b;
                        }
                    }}
                >
                    {a}
                </button>
            ))}
        </span>
    );
}

function ResourceEditor($item: ResourcesSpec) {
    return (
        <span>
            {ListRender($item, ($resource, symbol) => {
                return (
                    <span>
                        <input
                            type="text"
                            value={$resource.resource}
                            onInput={e =>
                                ($resource.resource = e.currentTarget.value)
                            }
                        />{" "}
                        {">="}
                        <input
                            type="text"
                            value={$resource.cost}
                            onInput={e =>
                                ($resource.cost = e.currentTarget.value)
                            }
                        />
                        <button onClick={() => $item.remove(symbol)}>-</button>
                    </span>
                );
            })}
            <button onClick={() => $item.push({ resource: "", cost: "0.00" })}>
                +
            </button>
        </span>
    );
}

function ItemEditor($item: ClickerSpecItem, removeSelf: () => void) {
    return (
        <div>
            <div>
                {SelectList<ClickerSpecItem>(
                    [
                        ["none", { type: "none" }],
                        ["spacer", { type: "spacer" }],
                        ["separator", { type: "separator" }],
                        [
                            "counter",
                            { type: "counter", name: "", description: "" },
                        ],
                        ["button", { type: "button", data: { name: "" } }],
                    ],
                    $item || $bind,
                )}
                <button onClick={() => removeSelf()}>-</button>
            </div>
            <h1>{$item.type}</h1>
            {$item.type === "none" ? (
                <div>No options to configure</div>
            ) : (
                <>
                    {$item.type === "spacer" ? (
                        <div>No options to configure for spacer</div>
                    ) : $item.type === "separator" ? (
                        <div>No options to configure for separator</div>
                    ) : $item.type === "counter" ? (
                        <div>
                            <label>
                                <div>Resource:</div>
                                <input
                                    type="text"
                                    value={$item.name}
                                    onInput={e =>
                                        ($item.name = e.currentTarget.value)
                                    }
                                />
                            </label>
                            <label>
                                <div>Description:</div>
                                <textarea
                                    value={$item.description}
                                    onInput={e =>
                                        ($item.description =
                                            e.currentTarget.value)
                                    }
                                />
                            </label>
                        </div>
                    ) : $item.type === "button" ? (
                        <div>
                            <label>
                                <div>Button Label:</div>
                                <input type="text" value={$item.data.name} />
                            </label>
                            <div>
                                Requires:{" "}
                                {$item.data.requirements ? (
                                    <>
                                        {ResourceEditor(
                                            $item.data.requirements || $bind,
                                        )}
                                        <button
                                            onClick={() =>
                                                ($item.data.requirements = undefined)
                                            }
                                        >
                                            -
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() =>
                                            ($item.data.requirements = $.list(
                                                [],
                                            ))
                                        }
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                            <div>
                                Price:{" "}
                                {$item.data.price ? (
                                    <>
                                        {ResourceEditor(
                                            $item.data.price || $bind,
                                        )}
                                        <button
                                            onClick={() =>
                                                ($item.data.price = undefined)
                                            }
                                        >
                                            -
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() =>
                                            ($item.data.price = $.list([]))
                                        }
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                            <div>
                                Effects:{" "}
                                {$item.data.effects ? (
                                    <>
                                        {ResourceEditor(
                                            $item.data.effects || $bind,
                                        )}
                                        <button
                                            onClick={() =>
                                                ($item.data.effects = undefined)
                                            }
                                        >
                                            x
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() =>
                                            ($item.data.effects = $.list([]))
                                        }
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : true ? (
                        <div>Unknown item type</div>
                    ) : null}
                </>
            )}
        </div>
    );
}

export default function ClickerEditor() {
    let $items = $.list<ClickerSpecItem>([
        {
            type: "counter",
            name: "achivement",
            description: "number of achivements you have recieved",
        },
        {
            type: "button",
            data: {
                name: "collect 100 gold",
                requirements: $.list([{ resource: "gold", cost: "100" }]),
                price: $.list([{ resource: "_ach1", cost: "1" }]),
                effects: $.list([{ resource: "achivement", cost: "1" }]),
            },
        },
        {
            type: "button",
            data: {
                name: "eat apple",
                price: $.list([
                    { resource: "apple", cost: "1" },
                    { resource: "_ach2", cost: "1" },
                ]),
                effects: $.list([{ resource: "achivement", cost: "1" }]),
            },
        },
        { type: "separator" },
        {
            type: "counter",
            name: "stamina",
            description: "stamina increases 0.01 per tick, max 1",
        },
        {
            type: "counter",
            name: "gold",
            description: "gold lets you purchase things",
        },
        {
            type: "button",
            data: {
                name: "fish gold from wishing well",
                price: $.list([{ resource: "stamina", cost: "0.1" }]),
                effects: $.list([{ resource: "gold", cost: "1" }]),
            },
        },
        {
            type: "counter",
            name: "market",
            description: "markets aquire 0.01 gold per tick",
        },
        {
            type: "button",
            data: {
                name: "purchase market",
                price: $.list([{ resource: "gold", cost: "25" }]),
                effects: $.list([{ resource: "market", cost: "1" }]),
            },
        },
        { type: "spacer" },
        { type: "counter", name: "apple", description: "an apple" },
        { type: "counter", name: "water", description: "water grows trees" },
        {
            type: "counter",
            name: "tree",
            description:
                "each full tree requires 2 water each tick to live and drops 1 apple per 10 ticks.",
        },
        {
            type: "counter",
            name: "seed",
            description: "an apple seed. uses 1 water each tick to grow",
        },
        {
            type: "button",
            data: {
                name: "purchase seed from market",
                price: $.list([{ resource: "gold", cost: "50" }]),
                requirements: $.list([{ resource: "market", cost: "5" }]),
                effects: $.list([{ resource: "seed", cost: "1" }]),
            },
        },
        {
            type: "button",
            data: {
                name: "take water from wishing well",
                price: $.list([{ resource: "stamina", cost: "1" }]),
                requirements: $.list([{ resource: "market", cost: "5" }]),
                effects: $.list([{ resource: "water", cost: "100" }]),
            },
        },
        { type: "counter", name: "bucket", description: "a bucket" },
        {
            type: "button",
            data: {
                name: "make bucket",
                price: $.list([
                    { resource: "tree", cost: "1" },
                    { resource: "gold", cost: "100" },
                ]),
                effects: $.list([{ resource: "bucket", cost: "1" }]),
            },
        },
        {
            type: "button",
            data: {
                name: "use bucket on wishing well",
                price: $.list([
                    { resource: "bucket", cost: "1" },
                    { resource: "stamina", cost: "1" },
                ]),
                effects: $.list([
                    { resource: "water", cost: "1000" },
                    { resource: "gold", cost: "10" },
                ]),
            },
        },
    ]);
    let $update = 0; // once deep events are used, this won't be needed
    return (
        <div>
            <textarea value={"" + $update && JSON.stringify($items)} />
            <div>
                <button onClick={() => $update++}>update</button>
            </div>
            <ul>
                <li>
                    <button
                        onClick={() =>
                            $items.insert(
                                { after: undefined },
                                { type: "none" },
                            )
                        }
                    >
                        +
                    </button>
                </li>
                {ListRender($items, ($item, symbol) => {
                    console.log(
                        "##Rendering item editor",
                        $item || $bind,
                        symbol,
                    );
                    return (
                        <>
                            <li>
                                {ItemEditor($item || $bind, () =>
                                    $items.remove(symbol),
                                )}
                            </li>
                            <li>
                                <button
                                    onClick={() =>
                                        $items.insert(
                                            { after: symbol },
                                            { type: "none" },
                                        )
                                    }
                                >
                                    +
                                </button>
                            </li>
                        </>
                    );
                })}
            </ul>
        </div>
    );
}
