import { existsSync, walkSync } from "https://deno.land/std/fs/mod.ts";
import { parse as argsParse } from "https://deno.land/std/flags/mod.ts";

const settingsFileName = "userSettings";

interface siteEntryOptions {
  altCSS: boolean;
  altJS: boolean;
  autoImportant: boolean;
  on: boolean;
}

interface siteEntry {
  compiledCss: string;
  css: string;
  id: string;
  name?: string;
  js: string;
  libs: string[];
  options: siteEntryOptions;
}

type strippedSiteEntry = Omit<siteEntry, "css" | "js">;

interface userData {
  libs: { name: string; src: string }[];
  settings: any;
  sites: siteEntry[];
}

type strippedUserData = Omit<userData, "sites">;

function isStrippedSiteEntry(obj: unknown): obj is strippedSiteEntry {
  if (obj && typeof obj === "object") {
    if (
      "id" in obj && "libs" in obj &&
      "compiledCss" in obj && "options" in obj
    ) {
      return true;
    }
  }
  return false;
}

function urlToFileName(url: string) {
  return url.replace(/(\*|\:|\\|\/)/g, "_");
}

function saveAsFiles(
  data: userData,
  folderName: string,
  applyPrefix?: boolean,
) {
  if (!existsSync(folderName)) Deno.mkdirSync(folderName);

  let i = 0;
  for (const sEntry of data.sites) {
    let fName = urlToFileName(sEntry.id);

    if (applyPrefix) {
      const prefix: string = i.toString().padStart(3, "0");
      fName = prefix + fName;
    }

    const strippedData: strippedSiteEntry = {
      compiledCss: sEntry.compiledCss,
      id: sEntry.id,
      libs: sEntry.libs,
      options: sEntry.options,
    };
    if (sEntry.name) strippedData.name = sEntry.name;

    Deno.writeTextFile(
      `${folderName}/${fName}.json`,
      JSON.stringify(strippedData, null, "\t"),
    );
    if (sEntry.js) Deno.writeTextFile(`${folderName}/${fName}.js`, sEntry.js);
    if (sEntry.css) {
      Deno.writeTextFile(`${folderName}/${fName}.css`, sEntry.css);
    }
    i++;
  }

  const userSettings: strippedUserData = {
    libs: data.libs,
    settings: data.settings,
  };

  Deno.writeTextFile(
    `${folderName}/${settingsFileName}.json`,
    JSON.stringify(userSettings, null, "\t"),
  );
}

/**
 * Convert an exported `.json` file to a folder containing several
 * `.js` and `.css` files with the same parsed information.
 * @param fileName the name of the file (without the extension)
 * @param applyPrefix if true applies a numbered prefix to the generated
 * files that will maintain the original order of the data
 */
function parseExport(fileName: string, applyPrefix?: boolean) {
  let json: userData | null = null;
  try {
    const fileContent = Deno.readTextFileSync(`${fileName}.json`);
    json = JSON.parse(fileContent);
  } catch (error) {
    console.error(error);
    return;
  }

  if (json) {
    saveAsFiles(json, fileName, applyPrefix);
  }
}

/**
 * Converts a folder of `.js` and `.css` files to the proper
 * `.json` export format (the opposite of the `parseExport` function).
 * @param folderName the folder in the current working directory that
 * will be used to generate the export file
 */
function compileExport(folderName: string) {
  let jsonPaths: [string, strippedSiteEntry][] = [];

  for (
    const f of walkSync(folderName, { includeDirs: false, match: [/.json$/] })
  ) {
    const json: unknown = JSON.parse(Deno.readTextFileSync(f.path));

    if (isStrippedSiteEntry(json)) jsonPaths.push([f.path, json]);
  }
  jsonPaths = jsonPaths.sort((a, b) => {
    if (a[0] === b[0]) return 0;
    else if (a[0] > b[0]) return 1;
    else return -1;
  });

  const sites: siteEntry[] = [];

  for (const [path, json] of jsonPaths) {
    const site: siteEntry = {
      compiledCss: json.compiledCss,
      css: "",
      id: json.id,
      js: "",
      libs: json.libs,
      name: json.name || "",
      options: json.options,
    };

    const pathJS = path.replace(/.json$/, ".js");
    const pathCSS = path.replace(/.json$/, ".css");
    if (existsSync(pathJS)) {
      const content = Deno.readTextFileSync(pathJS);
      site.js = content;
    }
    if (existsSync(pathCSS)) {
      const content = Deno.readTextFileSync(pathCSS);
      site.css = content;
    }

    sites.push(site);
  }

  const userSettings: strippedUserData = JSON.parse(
    Deno.readTextFileSync(`${folderName}/${settingsFileName}.json`),
  );
  const exportData: userData = {
    ...userSettings,
    sites: sites,
  };

  Deno.writeTextFile(`gen-${folderName}.json`, JSON.stringify(exportData));
}

function execute() {
  const parsedArgs = argsParse(Deno.args);

  if (typeof parsedArgs.c === "string") {
    parseExport(parsedArgs.c, !!parsedArgs.p);
  } else if (typeof parsedArgs.s === "string") {
    compileExport(parsedArgs.s);
  } else {
    console.log("❌ Invalid arguments!");
  }
}

console.time("⏱");
execute();
console.timeEnd("⏱");
