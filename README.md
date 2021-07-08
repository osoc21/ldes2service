# LDES2Service

LDES2Service is a set of NPM packages you can use to replicate an LDES in a back-end system of choice.

A Linked Data Event Stream (LDES) is a collection of immutable objects. The HTTP interface adheres to the [LDES specification](https://w3id.org/ldes/specification) by SEMIC. An LDES can be fragmented in different ways using the [TREE specification](https://w3id.org/tree/specification). Check the [TREE Linked Data Fragments website](https://tree.linkeddatafragments.org) for more background and implementations.

<div align="center">
    <img src="./.github/assets/crest.svg" width=200 height=200/>
</div>

## Installation

```bash
npm install
npm run build
cd packages/ldes-replicator && npm run start
node packages/ldes-replicator/bin/ldes-replicator.js
```

## Components

**ldes-dummy-connector:**<br />
An example to write your own connector

**ldes-replicator:**

**ldes-types:**

## Students

- [Arno Troch](https://github.com/ArnoTroch)
- [Carlos Ruiz](https://github.com/D34DPlayer)
- [Clément Vandendaelen](https://github.com/LotuxPunk)
- [Ryan Byloos](https://github.com/ryanbyloos)
- [Wout Verbiest](https://github.com/woutverbiest)

## Running it with Docker

_Coming soon_

## License

This project is released as an open-source project under the [MIT License](https://github.com/osoc21/ldes2service/blob/main/LICENSE)
