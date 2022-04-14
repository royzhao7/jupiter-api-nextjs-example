import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { INPUT_MINT_ADDRESS, OUTPUT_MINT_ADDRESS, Token } from "../../constants";

import styles from "./JupiterForm.module.css";
import { useJupiterApiContext } from "../../contexts/JupiterApiProvider";
import SelectSearch, { fuzzySearch } from 'react-select-search-nextjs';
import {
  getPlatformFeeAccounts,
  Jupiter,
  RouteInfo,
  TOKEN_LIST_URL,
} from "@jup-ag/core";


interface IJupiterFormProps { }
interface IState {
  amount: number;
  inputMint: PublicKey;
  outputMint: PublicKey;
  slippage: number;
}

const JupiterForm: FunctionComponent<IJupiterFormProps> = (props) => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { tokenMap, routeMap, loaded, api } = useJupiterApiContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isSlippage, setIsSlippage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValue, setFormValue] = useState<IState>({
    amount: 10, // unit in lamports (Decimals)
    inputMint: new PublicKey(INPUT_MINT_ADDRESS),
    outputMint: new PublicKey(OUTPUT_MINT_ADDRESS),
    slippage: 1, // 0.1%
  });
  const [routes, setRoutes] = useState<RouteInfo[]>([]);


  const inputMintOptions =  Array.from(routeMap.keys()).map((tokenMint) => {
   return ({ name: tokenMap.get(tokenMint)?.name || "unknown", value: tokenMint })
  })




  const options = [
    {name: 'Swedish', value: 'sv'},
    {name: 'English', value: 'en'},
   
];

  let top3 = '';
  routes?.forEach(route => {
    if (route.marketInfos !== undefined) {
      top3 = top3 + route.marketInfos[0].amm.label + ","
    }

  }
  )


  const [inputTokenInfo, outputTokenInfo] = useMemo(() => {
    return [
      tokenMap.get(formValue.inputMint?.toBase58() || ""),
      tokenMap.get(formValue.outputMint?.toBase58() || ""),
    ];
  }, [
    tokenMap,
    formValue.inputMint?.toBase58(),
    formValue.outputMint?.toBase58(),
  ]);

  const toggleBtn = () => {
    if (isSlippage) {
      setIsSlippage(false);
    } else {
      setIsSlippage(true);
    }
  }

// const intervalFetchRoute=()=>{
//   const interval = 100;
//   setTimeout(() => {
//     const interval = setInterval(() => {
//     /* do repeated stuff */
//     fetchRoute()
//     }, 2000)
//   }, 5000)


// console.log(Date.now());
// }


//   // Good to add debounce here to avoid multiple calls
//   const fetchRoute = React.useCallback(() => {
//     setIsLoading(true);
//     api
//       .v1QuoteGet({
//         amount: formValue.amount * 10 ** 6,
//         inputMint: formValue.inputMint.toBase58(),
//         outputMint: formValue.outputMint.toBase58(),
//         slippage: formValue.slippage
//       })
//       .then(({ data }) => {
//         if (data) {
//           setRoutes(data);
//         }
//       })
//       .finally(() => {
//         setIsLoading(false);
//       });
//   }, [api, formValue]);

//   useEffect(() => {
//     fetchRoute();
//   }, [fetchRoute]);



  const fetchRoute = async ({
    jupiter,
    inputToken,
    outputToken,
    inputAmount,
    slippage,
  }: {
    jupiter: Jupiter;
    inputToken?: Token;
    outputToken?: Token;
    inputAmount: number;
    slippage: number;
  }) => {
    try {
      if (!inputToken || !outputToken) {
        return null;
      }
  
      console.log(
        `Getting routes for ${inputAmount} ${inputToken.symbol} -> ${outputToken.symbol}...`
      );
      const inputAmountInSmallestUnits = inputToken
        ? Math.round(inputAmount * 10 ** inputToken.decimals)
        : 0;
      const routes =
        inputToken && outputToken
          ? await jupiter.computeRoutes({
              inputMint: new PublicKey(inputToken.address),
              outputMint: new PublicKey(outputToken.address),
              inputAmount: inputAmountInSmallestUnits, // raw input amount of tokens
              slippage,
              forceFetch: true,
              
            })
          : null;
  
      // if (routes && routes.routesInfos) {
      //   console.log(routes.routesInfos[0].marketInfos?.map((info) => info.amm.label));
      //   console.log(routes.routesInfos[1].marketInfos?.map((info) => info.amm.label));
      //   console.log(routes.routesInfos[2].marketInfos?.map((info) => info.amm.label));
      //   console.log("Possible number of routes:", routes.routesInfos.length);
      //   console.log(
      //     "Best quote: ",
      //     routes.routesInfos[0].outAmount / 10 ** outputToken.decimals,
      //     `(${outputToken.name})`
      //   );
      //   return routes;
      // } else {
      //   return null;
      // }
    } catch (error) {
      throw error;
    }
  };


  const validOutputMints = useMemo(
    () => routeMap.get(formValue.inputMint?.toBase58() || "") || [],
    [routeMap, formValue.inputMint?.toBase58()]
  );


  const outputOptions =  validOutputMints.map((tokenMint) => {
    return ({ name: tokenMap.get(tokenMint)?.name || "unknown", value: tokenMint })
   })
 

  // ensure outputMint can be swapable to inputMint
  useEffect(() => {
  
  }, [formValue.inputMint?.toBase58(), formValue.outputMint?.toBase58()]);

  if (!loaded) {
    return <div>刷新线路中...</div>;
  }

  return (
    <div className="max-w-full md:max-w-lg">
      <div className="mb-2 flex flex-row-reverse">
        <label htmlFor="my-modal" className="btn modal-button">1%</label>
        <input type="checkbox" id="my-modal" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <label htmlFor="my-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
            <h3 className="font-bold text-lg">滑点设置</h3>
            <div className="flex justify-between mt-5">
              <div className=""><button className="btn btn-lg w-32">0.1%</button></div>
              <div className=""><button className={`${isSlippage ? "btn-secondary" : ""
            } btn btn-lg w-32`} onClick={toggleBtn} >0.5%</button></div>
              <div className=""> <button className="btn btn-lg w-32">1%</button></div>
            </div>
            <div className="form-control w-full max-w-full">
              <label className="label">
                <span className="label-text">或手动输入</span>
              </label>
              <input type="text" placeholder="0.00%" className="input input-bordered w-full max-w-full" />
            </div>
            <div className="form-control w-full max-w-full">
              <label className="label">
                <span className="label-text">RPC设置</span>
              </label>
              <input type="text" placeholder="https://solana-api.projectserum.com" className="input input-bordered w-full max-w-full" />
            </div>
            <div className="modal-action w-full max-w-full">
              <label htmlFor="my-modal" className="btn w-full max-w-full">保存设置</label>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2">
        <label htmlFor="inputMint" className="block text-sm font-medium">
          您将支付
        </label>
        <SelectSearch
          id="inputMint"
          options={inputMintOptions}
          search filterOptions={fuzzySearch}
          value={formValue.inputMint?.toBase58()}
          onChange={e => {
            const pbKey = new PublicKey(e);
            console.log('inputMint:'+formValue.inputMint?.toBase58())
            console.log('outputMint:'+formValue.outputMint?.toBase58())
            if (pbKey) {
              setFormValue((val) => ({
                ...val,
                inputMint: pbKey,
              }));
            }
          }}
        />

      </div>
          
      <div className="mb-2">
        <label htmlFor="outputMint" className="block text-sm font-medium">
          您将收到
        </label>
        <SelectSearch
          id="outputMint"
          options={outputOptions}
          search filterOptions={fuzzySearch}
          value={formValue.outputMint?.toBase58()}
          onChange={(e) => {
            const pbKey = new PublicKey(e);
        
            if (pbKey) {
              setFormValue((val) => ({
                ...val,
                outputMint: pbKey,
              }));
            }
          }}
        />
         
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium">
          支付金额 ({inputTokenInfo?.symbol})
        </label>
        <div className="mt-1">
          <input
            name="amount"
            id="amount"
            className="shadow-sm bg-neutral p-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={formValue.amount}
            type="text"
            pattern="[0-9]*"
            onInput={(e: any) => {
              let newValue = Number(e.target?.value || 0);
              newValue = Number.isNaN(newValue) ? 0 : newValue;
              setFormValue((val) => ({
                ...val,
                amount: Math.max(newValue, 0),
              }
              
             
              ));
              if(routes?.[0].outAmount&& routes?.[0].outAmount>newValue){
              //  intervalFetchRoute();
              }
            }}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className={`${isLoading ? "opacity-50 cursor-not-allowed" : ""
            } inline-flex items-center px-4 py-2 mt-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          type="button"
          onClick={fetchRoute}
          disabled={isLoading}
        >
          {isLoading && (
            <div
              className={`${styles.loader} mr-4 ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24`}
            ></div>
          )}
          刷新线路
        </button>
      </div>

      <div>已找到{routes?.length==undefined?0:routes.length==0?0:routes.length-1}个路径</div>


      {routes?.[0] &&
        (() => {
          const route = routes[0];
          const secondaryRoute = routes[1];
          if (route) {
            return (
              <div>
                <div className="indicator mt-4 w-full">
                  <span className="indicator-item ml-14 indicator-start badge badge-secondary">最优的交易价格</span>
                  <div className="grid grid-cols-2 gap-4 w-full h-16  bg-gray-400">
                    <div className="pt-4 pl-2">  {route.marketInfos?.map((info) => info.amm.label)}</div>
                    <div className="pt-4 pl-8">  <p className="text-xl font-sans">  {(route.outAmount || 0) /
                      10 ** (outputTokenInfo?.decimals || 1)}{" "}
                      {outputTokenInfo?.symbol}</p> </div>
                  </div>
                </div>
                <div className="indicator mt-4 w-full" >
                  <div className="grid grid-cols-2 gap-4 w-full h-16  bg-gray-400">

                    <div className="pt-4 pl-2">     {secondaryRoute.marketInfos?.map((info) => info.label)}</div>
                    <div className="pt-4 pl-8">   <p className="text-xl font-sans">   {(secondaryRoute.outAmount || 0) /
                      10 ** (outputTokenInfo?.decimals || 1)}{" "}
                      {outputTokenInfo?.symbol}</p></div>

                  </div>
                </div>
              </div>
            );
          }
        })()}

      <div className="flex justify-center mt-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={async () => {
            try {
              if (
                !isLoading &&
                routes?.[0] &&
                wallet.publicKey &&
                wallet.signAllTransactions
              ) {
                setIsSubmitting(true);

                const {
                  swapTransaction,
                  setupTransaction,
                  cleanupTransaction,
                } = await api.v1SwapPost({
                  body: {
                    route: routes[0],
                    userPublicKey: wallet.publicKey.toBase58(),
                    wrapUnwrapSOL:false
                  },
                });

                console.log(wallet.publicKey)
                console.log(wallet.publicKey.toBase58())
                const transactions = (
                  [
                    setupTransaction,
                    swapTransaction,
                    cleanupTransaction,
                  ].filter(Boolean) as string[]
                ).map((tx) => {
                  return Transaction.from(Buffer.from(tx, "base64"));
                });

                await wallet.signAllTransactions(transactions);
                for (let transaction of transactions) {
                  // get transaction object from serialized transaction

                  // perform the swap
                  const txid = await connection.sendRawTransaction(
                    transaction.serialize()
                  );

                  await connection.confirmTransaction(txid);
                  console.log(`https://solscan.io/tx/${txid}`);
                }
              }
            } catch (e) {
              console.error(e);
            }
            setIsSubmitting(false);
          }}
          className="w-full items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSubmitting ? "兑换中.." : "兑换"}
        </button>
      </div>
    </div>
  );
};

export default JupiterForm;
