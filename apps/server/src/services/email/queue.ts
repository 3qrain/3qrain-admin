type Task = () => Promise<void>

const queue: Task[] = []
let running = 0
// 邮件发送并发量
const MAX_CONCURRENCY = 3

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
  // if (queue.length > 999) throw new Error('邮件发送队列已满')
  queue.push(task)
  next()
}
