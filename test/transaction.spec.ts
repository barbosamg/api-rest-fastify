import {
  expect,
  test,
  beforeAll,
  afterAll,
  describe,
  beforeEach,
} from "vitest";
import request from "supertest";
import { app } from "../src/app";
import { execSync } from "node:child_process";
import {} from "node:test";

const TRANSACTIONS_ROUTE = "/transactions";
const TRANSACTIONS_SUMMARY_ROUTE = "/transactions/summary";

describe("Transactions routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    execSync("npm run knex migrate:rollback --all");
  });

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  test("user can create a new transaction", async () => {
    const response = await request(app.server).post(TRANSACTIONS_ROUTE).send({
      title: "Transação de teste",
      amount: 1000,
      type: "credit",
    });

    expect(response.statusCode).toEqual(201);
  });

  test("should be able to list all transactions", async () => {
    const createdTransactionResponse = await request(app.server)
      .post(TRANSACTIONS_ROUTE)
      .send({
        title: "Transação de teste",
        amount: 1000,
        type: "credit",
      });

    const cookies = createdTransactionResponse.get("Set-Cookie") ?? [];
    const transactionsResponse = await request(app.server)
      .get(TRANSACTIONS_ROUTE)
      .set("Cookie", cookies);

    expect(transactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "Transação de teste",
        amount: 1000,
      }),
    ]);
  });

  test("should be able to get a specific transaction", async () => {
    const createdTransactionResponse = await request(app.server)
      .post(TRANSACTIONS_ROUTE)
      .send({
        title: "Transação de teste",
        amount: 1000,
        type: "credit",
      });

    const cookies = createdTransactionResponse.get("Set-Cookie") ?? [];
    const transactionsResponse = await request(app.server)
      .get(TRANSACTIONS_ROUTE)
      .set("Cookie", cookies);

    const transactionId = transactionsResponse.body.transactions[0].id;
    const getTransactionResponse = await request(app.server)
      .get(`${TRANSACTIONS_ROUTE}/${transactionId}`)
      .set("Cookie", cookies);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "Transação de teste",
        amount: 1000,
      })
    );
  });

  test("should be able to get the summary", async () => {
    const createdTransactionResponse = await request(app.server)
      .post(TRANSACTIONS_ROUTE)
      .send({
        title: "Transação de teste",
        amount: 1000,
        type: "credit",
      });

    const cookies = createdTransactionResponse.get("Set-Cookie") ?? [];

    await request(app.server)
      .post(TRANSACTIONS_ROUTE)
      .set("Cookie", cookies)
      .send({
        title: "Transação de teste 2",
        amount: 2000,
        type: "credit",
      });

    const summaryResponse = await request(app.server)
      .get(TRANSACTIONS_SUMMARY_ROUTE)
      .set("Cookie", cookies);

    expect(summaryResponse.body.summary).toEqual({ totalAmount: 3000 });
  });
});
