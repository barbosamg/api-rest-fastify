// eslint-disable-next-line
import { Knex } from "knex";

declare module "knex/type/tables" {
  export interface Tables {
    transactions: {
      id: string;
      title: string;
      amount: number;
      created_at: Date;
      session_id?: string | null;
    };
  }
}
