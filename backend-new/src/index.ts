import express from 'express';
import { buildApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const app = buildApp();

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// app.get('/', (request, response) => {
//   response.send('Express + TypeScript Server');
// });

