/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import type { PluginConfigType } from './types';
import { AEConfig } from './register/ae';
import { AzureConfig } from './register/azure';
import { BitBucketConfig } from './register/bitbucket';
import { DBTConfig } from './register/dbt';
import { DORAConfig } from './register/dora';
import { FeiShuConfig } from './register/feishu';
import { GiteeConfig } from './register/gitee';
import { GitExtractorConfig } from './register/gitextractor';
import { GitHubConfig } from './register/github';
import { GitHubGraphqlConfig } from './register/github_graphql';
import { GitLabConfig } from './register/gitlab';
import { JenkinsConfig } from './register/jenkins';
import { JIRAConfig } from './register/jira';
import { RefDiffConfig } from './register/refdiff';
import { StarRocksConfig } from './register/starrocks';
import { TAPDConfig } from './register/tapd';
import { WebhookConfig } from './register/webook';
import { ZenTaoConfig } from './register/zentao';
import { GoogleConfig } from '@/plugins/register/google';

export const PluginConfig: PluginConfigType[] = [
  AEConfig,
  AzureConfig,
  DBTConfig,
  DORAConfig,
  FeiShuConfig,
  GiteeConfig,
  GitExtractorConfig,
  GitHubConfig,
  GitHubGraphqlConfig,
  GitLabConfig,
  JenkinsConfig,
  JIRAConfig,
  RefDiffConfig,
  StarRocksConfig,
  BitBucketConfig,
  TAPDConfig,
  ZenTaoConfig,
  WebhookConfig,
  GoogleConfig,
];
