import express, { json, urlencoded } from "express";
import type { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { parse } from "marked";
import {
    CenterCircle,
    Circle,
    ComponentSettingsContainer,
    Flag,
    Page,
    PageBody,
    Rect,
} from "./html";
import type { ColorableSVG, Component, FlagDimensions } from "./types";
import { randFrom, randInt, randIntBetween } from "./utilities";

const inputText = Bun.file("input.md");

const markdownHtml = await parse(await inputText.text());

const randomComponents: Array<
    (settings: FlagDimensions & ColorableSVG & Component) => string
> = [
    (settings: FlagDimensions & ColorableSVG & Component) =>
        CenterCircle(settings),
    // Random Circle
    ({ width, height, ...rest }: FlagDimensions & ColorableSVG & Component) =>
        Circle({
            cx: randIntBetween(0, width),
            cy: randIntBetween(0, height),
            r: randIntBetween(1, Math.max(width, height)),
            ...rest,
        }),

    // Top half Horizontal stripe
    ({ width, height, ...rest }: FlagDimensions & ColorableSVG & Component) => {
        return Rect({
            x: 0,
            width,
            y: 0,
            height: height / 2,
            ...rest,
        });
    },

    // Bottom half Horizontal stripe
    ({ width, height, ...rest }: FlagDimensions & ColorableSVG & Component) => {
        return Rect({
            x: 0,
            width,
            y: height / 2,
            height: height,
            ...rest,
        });
    },

    // Vertical left half stripe
    ({ width, height, ...rest }: FlagDimensions & ColorableSVG & Component) => {
        return Rect({
            y: 0,
            height,
            x: 0,
            width: width / 2,
            ...rest,
        });
    },

    // Vertical right half stripe
    ({ width, height, ...rest }: FlagDimensions & ColorableSVG & Component) => {
        return Rect({
            y: 0,
            height,
            x: width / 2,
            width: width,
            ...rest,
        });
    },
];

const toHex: (n: number) => string = (n) => n.toString(16).padStart(2, "0");
const randHex: () => string = () => toHex(randInt(256));
const randomColor: () => string = () => `#${randHex()}${randHex()}${randHex()}`;

const height = 180;
const width = height * 1.9;
const flagDimensions: FlagDimensions = { height, width };

const app = express();
const port = process.env.PORT || 3006;

app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: true }));

app.get("/", (req, res) => {
    const flagComponents: string[] = [];
    const numComponents = randIntBetween(2, 4);
    for (var i = 0; i < numComponents; i++) {
        const componentIndex = randInt(randomComponents.length);
        const componentFn = randomComponents[componentIndex];
        const settings = {
            ...flagDimensions,
            stroke: randomColor(),
            fill: randomColor(),
            componentId: `component-${i}`,
            componentIndex: componentIndex.toString(),
        };
        const component = componentFn(settings);
        const componentWrapped = ComponentSettingsContainer({
            contents: component,
            ...settings,
        });
        flagComponents.push(componentWrapped);
    }
    res.send(
        Page({
            title: "Flag generator",
            contents: PageBody({
                forward: markdownHtml,
                flag: Flag({
                    ...flagDimensions,
                    contents: flagComponents.join(""),
                }),
            }),
        }),
    );
});

app.post("/swapComponent.svg", (req, res) => {
    let { components, selected }: Record<string, string | string[]> = req.body;

    if (!Array.isArray(components)) components = [components];

    let settings: Array<FlagDimensions & ColorableSVG & Component> =
        components.map((c) => JSON.parse(c));
    if (Array.isArray(selected))
        throw new Error("Multiple selected not supported");
    if (!selected) throw new Error("Selection required");

    const removed = settings.find(({ componentId }) => componentId == selected);
    if (!removed) throw new Error("Couldn't find component to remove");
    const removedId = removed.componentId;
    settings = settings.filter(({ componentId }) => componentId !== selected);

    // Repeat the remaining ones
    const flagComponents: string[] = [];
    const numComponents = settings.length;
    for (var i = 0; i < numComponents; i++) {
        const componentSettings = settings[i];
        const componentIndex = parseInt(componentSettings.componentIndex, 10);
        const componentFn = randomComponents[componentIndex];
        const component = componentFn(componentSettings);
        const componentWrapped = ComponentSettingsContainer({
            contents: component,
            ...componentSettings,
        });
        flagComponents.push(componentWrapped);
    }

    // And swap in a new one
    const componentIndex = randInt(randomComponents.length);
    const componentFn = randomComponents[componentIndex];
    const newComponentSettings = {
        ...flagDimensions,
        stroke: randomColor(),
        fill: randomColor(),
        componentId: `${removedId}-swapped`,
        componentIndex: componentIndex.toString(),
    };
    const component = componentFn(newComponentSettings);
    const componentWrapped = ComponentSettingsContainer({
        contents: component,
        ...newComponentSettings,
    });
    flagComponents.push(componentWrapped);
    res.send(
        Flag({
            ...flagDimensions,
            contents: flagComponents.join(""),
        }),
    );
});

app.use(express.static("public"));

//
// Final 404/5XX handlers
//
app.use(function (err, req, res, next) {
    console.error("5XX", err);
    res.status(err?.status || 500);

    res.send("500");
} as ErrorRequestHandler);

app.use(function (_req, res) {
    res.status(404);
    res.send("404");
});

const baseDomain =
    process.env.NODE_ENV === "production"
        ? `localhost:${port}`
        : `localhost:${port}`;
const baseURL =
    process.env.NODE_ENV === "production"
        ? `https://${baseDomain}`
        : `http://${baseDomain}`;
const listener = app.listen(port, () => {
    console.log(`Server is available at ${baseURL}`);
});

// So I can kill from local terminal with Ctrl-c
// From https://github.com/strongloop/node-foreman/issues/118#issuecomment-475902308
process.on("SIGINT", () => {
    listener.close(() => {});
    // Just wait some amount of time before exiting. Ideally the listener would
    // close successfully, but it seems to hang for some reason.
    setTimeout(() => process.exit(0), 150);
});
