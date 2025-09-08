import { pipeline } from '@huggingface/transformers';
import type { WorkerMessage, WorkerResponse } from './types.ts'


// 変換関数
async function convertKanaToKanji(input: WorkerMessage) {
  const pipe = await pipeline('text-generation', input.model, {
    device: input.webgpu ? 'webgpu' : void 0,
    dtype: 'fp32',
  });
  // 特殊トークンを追加して入力を整形
  const prefix = "\uEE00";
  const suffix = "\uEE01";
  const processedInput = prefix + input.kana + suffix;

  // テキスト生成を実行
  const output = await pipe(processedInput, {
    max_new_tokens: 50, // 適切なトークン数を設定
  });

  // 出力を整形
  const modelOutput = output[0].generated_text;

  // 後ろの特殊トークン以降の部分を抽出
  if (modelOutput.includes(suffix)) {
    return modelOutput.split(suffix)[1].trim();
  }

  return modelOutput.trim();
}

// 使い方
// (async () => {
//   const inputKana = "コウシキ";
//   const result = await convertKanaToKanji(inputKana);
//   console.log(`変換結果: ${result}`); // 出力: 講師
// })();

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  console.log('from main thread', event.data)

  try {
    // 結果をメインスレッドに送り返す
    const res = await convertKanaToKanji(event.data)
    self.postMessage({ converted: res, ok: true } satisfies WorkerResponse);
  } catch (error) {
    console.error('変換中にエラー', error)
    // エラーをメインスレッドに送る
    self.postMessage({ converted: "[ ERROR ]", ok: false } satisfies WorkerResponse);
  }
});
