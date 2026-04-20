declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf-8"): string;
  export function writeFileSync(path: string, data: string, encoding: "utf-8"): void;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
}

declare module "node:readline/promises" {
  export function createInterface(options: {
    input: unknown;
    output: unknown;
  }): {
    question(query: string): Promise<string>;
    close(): void;
  };
}

declare const process: {
  cwd: () => string;
  argv: string[];
  stdin: unknown;
  stdout: unknown;
  exit: (code?: number) => never;
};
