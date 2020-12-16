# user-js-parse

This CLI application parses exports from the "User JavaScript and CSS" Chrome extension to a folder with human readable `.js` and `.css` files. It also can convert back to the original export format.

This is useful for merging several exported files.

## Installation

1.  Install Deno from https://deno.land
2.  Clone/download this repo
3.  Run the following command in a terminal:
```sh
deno install --unstable --allow-read --allow-write -n user-js-parse mod.ts
```
4. Add the Deno bin folder to your environment path
```sh
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
```
   OR:
```sh
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.zshrc
```
5. Example use:
```sh
user-js-parse -c user-js-css-v8 # Parse to readable
user-js-parse -s user-js-css-v8 # Convert back to export
```