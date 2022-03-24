import express from "express";
import cors from "cors";
import figlet from "figlet";

const app = express();

const DEFAULT_PORT = 3030

const data: Map<string, string> = new Map();

app.use(cors());

app.get('/:alias', (req, res) => {
  const alias = req.params.alias;
  const id = data.get(alias);
  console.log(`Get request for alias ${alias}`);
  if (id) {
    res.send(id);
  } else throw new Error(`Unknown container: ${alias}`)
});

app.put('/:alias/id/:id', (req, res) => {
  const alias = req.params.alias;
  const id = req.params.id;
  console.log(`Put request for alias=${alias} & id=${id}`);
  data.set(alias, id);
  res.send(alias);
});

app.listen(DEFAULT_PORT, () => {
  console.log(`Listening on port ${DEFAULT_PORT}`)
  const out = figlet.textSync('Plexus NS Started', {
    font: 'Standard'
  });
  console.log(out);
});