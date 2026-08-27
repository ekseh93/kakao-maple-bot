/* global console, process */

import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const template = resolve(root, 'apps/lambda/template.yaml');
const artifact = resolve(root, 'apps/lambda/dist/lambda.zip');
const awsRegion = 'ap-northeast-1';
const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const bucket = required('LAMBDA_ARTIFACT_BUCKET');
const stackName = process.env.STACK_NAME?.trim() || 'kakao-maple-bot';
const key = process.env.LAMBDA_ARTIFACT_KEY?.trim() || 'kakao-maple-bot/lambda.zip';
const approval = process.env.DEPLOY_CONFIRMATION;
if (approval !== 'I_APPROVE_AWS_DEPLOYMENT')
  throw new Error('Set DEPLOY_CONFIRMATION=I_APPROVE_AWS_DEPLOYMENT to run deployment.');

await access(artifact);
const identity = await run('aws', [
  'sts',
  'get-caller-identity',
  '--region',
  awsRegion,
  '--output',
  'json',
]);
const arn = JSON.parse(identity).Arn ?? '';
if (arn.endsWith(':root') && process.env.ALLOW_ROOT_DEPLOY !== 'true')
  throw new Error('Refusing root-account deployment. Use an IAM user or role.');

await run('aws', ['s3', 'cp', artifact, `s3://${bucket}/${key}`, '--region', awsRegion]);
const overrides = [
  `LambdaArtifactBucket=${bucket}`,
  `LambdaArtifactKey=${key}`,
  `BotEnabled=${process.env.BOT_ENABLED || 'false'}`,
  `AllowedRooms=${process.env.ALLOWED_ROOMS || ''}`,
  `StockEnabled=${process.env.STOCK_ENABLED || 'false'}`,
  `BotSharedSecret=${process.env.BOT_SHARED_SECRET || ''}`,
  `NexonApiKey=${process.env.NEXON_API_KEY || ''}`,
  `KisAppKey=${process.env.KIS_APP_KEY || ''}`,
  `KisAppSecret=${process.env.KIS_APP_SECRET || ''}`,
];
await run('aws', [
  'cloudformation',
  'deploy',
  '--template-file',
  template,
  '--stack-name',
  stackName,
  '--capabilities',
  'CAPABILITY_NAMED_IAM',
  '--parameter-overrides',
  ...overrides,
  '--no-fail-on-empty-changeset',
  '--region',
  awsRegion,
]);
console.log(`CloudFormation deployment completed for stack ${stackName}.`);

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'inherit'], shell: false });
    let stdout = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolvePromise(stdout) : reject(new Error(`${command} exited with code ${code}`)),
    );
  });
}
