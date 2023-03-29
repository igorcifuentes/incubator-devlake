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

import React, { useState, useMemo } from 'react';
import { Button, Intent } from '@blueprintjs/core';

import { NoData } from '@/components';
import type { WebhookItemType } from '@/plugins/register/webook';
import { WebhookCreateDialog, WebhookSelectorDialog, WebHookConnection } from '@/plugins/register/webook';

import type { ProjectType } from '../types';

interface Props {
  project: ProjectType;
  saving: boolean;
  onSelectWebhook: (items: WebhookItemType[]) => void;
  onCreateWebhook: (id: ID) => any;
  onDeleteWebhook: (id: ID) => any;
}

export const IncomingWebhooksPanel = ({
  project,
  saving,
  onSelectWebhook,
  onCreateWebhook,
  onDeleteWebhook,
}: Props) => {
  const [type, setType] = useState<'selectExist' | 'create'>();

  const webhookIds = useMemo(
    () =>
      project.blueprint
        ? project.blueprint.settings.connections
            .filter((cs: any) => cs.plugin === 'webhook')
            .map((cs: any) => cs.connectionId)
        : [],
    [project],
  );

  const handleCancel = () => {
    setType(undefined);
  };

  if (!webhookIds.length) {
    return (
      <>
        <NoData
          text="Push `incidents` or `deployments` from your tools by incoming webhooks."
          action={
            <>
              <Button intent={Intent.PRIMARY} icon="plus" text="Add a Webhook" onClick={() => setType('create')} />
              <div style={{ margin: '8px 0' }}>or</div>
              <Button
                outlined
                intent={Intent.PRIMARY}
                text="Select Existing Webhooks"
                onClick={() => setType('selectExist')}
              />
            </>
          }
        />
        {type === 'create' && <WebhookCreateDialog isOpen onCancel={handleCancel} onSubmitAfter={onCreateWebhook} />}
        {type === 'selectExist' && (
          <WebhookSelectorDialog isOpen saving={saving} onCancel={handleCancel} onSubmit={onSelectWebhook} />
        )}
      </>
    );
  }

  return <WebHookConnection filterIds={webhookIds} onCreateAfter={onCreateWebhook} onDeleteAfter={onDeleteWebhook} />;
};
