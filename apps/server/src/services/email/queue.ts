type Task = () => Promise<void>

const queue: Task[] = []
let running = 0
// 邮件发送并发量
const MAX_CONCURRENCY = 1

function next() {
  while (running < MAX_CONCURRENCY && queue.length > 0) {
    const task = queue.shift()
    if (!task) break

    running++

    task().finally(() => {
      running--
      next()
    })
  }
}

export function enqueue(task: Task) {
  queue.push(task)
  next()
}
