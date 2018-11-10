import * as readline from 'readline'

interface PromptOptions {
  masked?: boolean
}

export const prompt = (question: string, options?: PromptOptions) => {
  return new Promise<string>((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(question, answer => {
      resolve(answer)
    })
  })
}
