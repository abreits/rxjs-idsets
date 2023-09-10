# rxjs-idsets library buildpack

This library buildpack was originally generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.0 and upgraded to 16.2.1.

The library code itself can be found in the [projects/rxjs-idsets](projects/rxjs-idsets) directory.

## Why us Angular Cli for this library

[Angular CLI](https://github.com/angular/angular-cli) provides an easy way to setup the scaffolding for the generic rxjs-idsets Typescript library that just works out of the box.

This is both because I as the author am familiar with the Angular ecosystem, but also because it makes it easy to create a working NPM library.

I have tried to remove all unused Angular packages from the root `package.json` in order to try to minimize the space used to build the `rxjs-idsets` library.
Unfortunately it remains quite a large project to build this relatively small library.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/rxjs-idsets` directory.

## Lint

Run `npm run lint` to check the code with [ESLint](https://eslint.org/)

## Running unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running unit tests with code coverage

Run `npm run coverage` to execute the unit tests with code coverage via [Karma](https://karma-runner.github.io).
Detailed coverage results can be found in the `coverage/rxjs-idsets` directory.

## Full build

Run `npm run build-ci` for a full lint, unittest and coverage

## Further help

To get more help on the Angular CLI use `npx ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
