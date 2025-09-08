import './App.css'
import AIWorker from './worker.ts?worker'
import type { WorkerMessage, WorkerResponse } from './types.ts'
import { createSignal } from 'solid-js'

// https://gist.github.com/kawanet/5553478
function hiraganaToKatagana(src: string): string {
  return src.replace(/[\u3041-\u3096]/g, function(match) {
    const chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

function App() {
  const worker = new AIWorker()
  const [res, setRes] = createSignal<string>('')
  const [rawKana, setRawKana] = createSignal<string>('')
  const [useWebGPU, setUseWebGPU] = createSignal<boolean>(false)
  const [model, setModel] = createSignal<string>('')
  const [timer, setTimer] = createSignal<number>(0)
  const [converting, setConvertiog] = createSignal<boolean>(false)

  let startTime = Date.now()

  worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
    console.log("from worker", e)
    setTimer((Date.now() - startTime)/1000)
    setConvertiog(false)
    setRes(e.data.converted)
  }

  return (
    <>
      <h1>Zenzモデルによるローカルかな漢字変換のデモ</h1>
      <form onsubmit={e => {
        e.preventDefault()
        setConvertiog(true)
        startTime = Date.now()
        worker.postMessage({
          kana: hiraganaToKatagana(rawKana()),
          model: model(),
          webgpu: useWebGPU(),
        } satisfies WorkerMessage )
      }}>
        <input type='text' placeholder='ここにテキストを入力' required name='kana_raw' oninput={e=>setRawKana(e.target.value)} />
        <button type='submit' disabled={converting()}>変換する</button>
        <div>
          <div>変換オプション</div>
            <label><input type="checkbox" name="webgpu" oninput={(e) => setUseWebGPU(e.target.checked)} /> WebGPUを使用</label>
            <select name="favorite-cuisine" aria-label="Select your favorite cuisine..." required oninput={e => {
              setModel(e.target.value)
            }}>
              <option selected disabled value="">モデルを選択</option>
              <option value='akku1139/zenz-v2.5-xsmall-onnx'>xsmall (22.5M)</option>
              <option value='akku1139/zenz-v2.5-small-onnx'>small (90.5M)</option>
              <option value='akku1139/zenz-v2.5-medium-onnx'>medium (310M)</option>
            </select>
        </div>
      </form>
      <hr />
      <input type='text' placeholder='ここに変換結果が出力されます' readonly value={res()} disabled={res()===void 0} />
      <div>所要時間: {timer()}秒</div>
    </>
  )
}

export default App
