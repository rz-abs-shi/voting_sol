import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from '@/../anchor/target/types/voting';
import { AnchorError, Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";
const IDL = require("@/../anchor/target/idl/voting.json");

export const OPTIONS = GET;


export async function GET(request: Request) {
  const actionMetaData: ActionGetResponse = {
    icon: "https://stick-to-science.eu/wp-content/uploads/2022/01/Stick-to-Science-Logo-Quadrat.png",
    description: "Which science do you prefer? Math or physics?",
    title: "Math or Physics?",
    label: "vote",
    links: {
      actions: [
        {
          label: "Vote Math",
          href: "/api/vote?candidate=Math",
          type: "message"
        },
        {
          label: "Vote Physics",
          href: "/api/vote?candidate=Phyciscs",
          type: "message"
        },
      ]
    }
  };

  return Response.json(actionMetaData, {headers: ACTIONS_CORS_HEADERS});
}


export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get('candidate');
  
  if (!candidate || !["Math", "Phyciscs"].includes(candidate)) {
    return new Response("Invalid candidate", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<Voting> = new Program(IDL, {connection});
  
  const body: ActionPostRequest = await request.json();
  let voter 

  try {
    voter = new PublicKey(body.account);
  } catch {
    return new Response("Invalid account", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const instruction = await program.methods
    .vote(new BN(1), candidate)
    .accounts({
      signer: voter
    })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction
    }
  })

  return Response.json(response, {headers: ACTIONS_CORS_HEADERS});
}
