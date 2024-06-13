import { html, htmlifyJson, type WithContents } from "./utilities";
import type {
    ColorableSVG,
    Component,
    FlagDimensions,
    NumericAttr,
} from "./types";

export const Page = ({
    contents,
    title,
}: WithContents & { title: string }) => html`
    <!doctype html>
    <html class="no-js" lang="">
        <head>
            <meta charset="utf-8" />
            <meta http-equiv="x-ua-compatible" content="ie=edge" />
            <title>${title}</title>
            <meta name="description" content="My resume, auto generated" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1"
            />

            <link rel="stylesheet" href="site.css" />
        </head>

        <body>
            ${contents}

            <script src="./htmx.js"></script>
        </body>
    </html>
`;

export const PageBody = ({
    flag,
    forward,
}: {
    flag: string;
    forward: string;
}) => html` <main>${forward} ${flag}</main> `;

export const Flag = ({
    height,
    width,
    contents,
}: WithContents & FlagDimensions) => html`
    <svg
        viewBox="0 0 ${width} ${height}"
        width="${width}"
        height="${height}"
        xmlns="http://www.w3.org/2000/svg"
        hx-target="closest svg"
    >
        <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
        ${contents}
    </svg>
`;

export const CenterCircle = ({
    height,
    width,
    ...rest
}: FlagDimensions & ColorableSVG) =>
    Circle({
        cx: (width / 2).toString(),
        cy: height / 2,
        r: Math.min(width, height) / 2,
        ...rest,
    });

export const Circle = ({
    cy,
    cx,
    r,
    fill,
    stroke,
    componentId,
}: { cx: NumericAttr; cy: NumericAttr; r: NumericAttr } & ColorableSVG &
    Component) => html`
    <circle
        cx="${cx}"
        cy="${cy}"
        r="${r}"
        fill="${fill}"
        stroke="${stroke}"
        hx-post="/swapComponent.svg"
        hx-trigger="click"
        hx-include="input"
        hx-vals="${htmlifyJson({ selected: componentId })}"
    />
`;

export const Rect = ({
    x,
    y,
    width,
    height,
    fill,
    stroke,
    componentId,
}: {
    x: NumericAttr;
    y: NumericAttr;
    width: NumericAttr;
    height: NumericAttr;
} & ColorableSVG &
    Component) =>
    html` <rect
        x="${x}"
        y="${y}"
        width="${width}"
        height="${height}"
        fill="${fill}"
        stroke="${stroke}"
        hx-post="/swapComponent.svg"
        hx-trigger="click"
        hx-include="input"
        hx-vals="${htmlifyJson({ selected: componentId })}"
    />`;

export const ComponentSettingsContainer = ({
    contents,
    ...settings
}: FlagDimensions & ColorableSVG & Component & WithContents) => html`
    <g>
        <foreignObject>
            <input
                type="hidden"
                name="components"
                value="${htmlifyJson(settings)}"
                xmlns="http://www.w3.org/1999/xhtml"
            />
        </foreignObject>

        ${contents}
    </g>
`;
