import { Args, Command } from '@effect/cli'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Console, Effect } from 'effect'

const workNum = Args.integer({ name: 'n' }).pipe(Args.withDescription('Work number'))

const workNew = Command.make('new', {}, () =>
  Effect.gen(function* () {
    yield* Console.log('work:new')
  })
)

const workDev = Command.make('dev', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    yield* Console.log(`work:dev ${n}`)
  })
)

const workBuild = Command.make('build', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    yield* Console.log(`work:build ${n}`)
  })
)

const workMeta = Command.make('meta', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    yield* Console.log(`work:meta ${n}`)
  })
)

const workDeploy = Command.make('deploy', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    yield* Console.log(`work:deploy ${n}`)
  })
)

const workPublish = Command.make('publish', { n: workNum }, ({ n }) =>
  Effect.gen(function* () {
    yield* Console.log(`work:publish ${n}`)
  })
)

const workPublishAll = Command.make('publish-all', {}, () =>
  Effect.gen(function* () {
    yield* Console.log('work:publish:all')
  })
)

const work = Command.make('work').pipe(
  Command.withSubcommands([workNew, workDev, workBuild, workMeta, workDeploy, workPublish, workPublishAll])
)

const dot = Command.make('dot').pipe(
  Command.withSubcommands([work])
)

const cli = Command.run(dot, { name: 'dot', version: '1.0.0' })

cli(process.argv).pipe(
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
