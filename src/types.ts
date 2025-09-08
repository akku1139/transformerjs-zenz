export type WorkerMessage = {
  kana: string
  model: string
  webgpu: boolean
}

export type WorkerResponse = {
  ok: boolean
  converted: string
}
