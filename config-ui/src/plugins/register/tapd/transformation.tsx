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

import React, { useEffect, useState } from 'react';
import { FormGroup, InputGroup, Intent, Tag } from '@blueprintjs/core';

import { Divider, ExternalLink, HelpTooltip, MultiSelector, PageLoading } from '@/components';
import { useProxyPrefix, useRefreshData } from '@/hooks';

import * as API from './api';
import * as S from './styled';

enum StandardType {
  Feature = 'FEATURE',
  Bug = 'BUG',
  Incident = 'INCIDENT',
}

enum StandardStatus {
  Todo = 'TODO',
  InProgress = 'IN-PROGRESS',
  Done = 'DONE',
}

interface Props {
  connectionId: ID;
  scopeId: ID;
  transformation: any;
  setTransformation: React.Dispatch<React.SetStateAction<any>>;
}

export const TapdTransformation = ({ connectionId, scopeId, transformation, setTransformation }: Props) => {
  const [featureTypeList, setFeatureTypeList] = useState<string[]>([]);
  const [bugTypeList, setBugTypeList] = useState<string[]>([]);
  const [incidentTypeList, setIncidentTypeList] = useState<string[]>([]);
  const [todoStatusList, setTodoStatusList] = useState<string[]>([]);
  const [inProgressStatusList, setInProgressStatusList] = useState<string[]>([]);
  const [doneStatusList, setDoneStatusList] = useState<string[]>([]);

  const prefix = useProxyPrefix({ plugin: 'tapd', connectionId });

  const { ready, data } = useRefreshData<{
    statusList: Array<{
      id: string;
      name: string;
    }>;
    typeList: Array<{
      id: string;
      name: string;
    }>;
  }>(async () => {
    if (!prefix) {
      return {
        statusList: [],
        typeList: [],
      };
    }

    const [storyType, bugType, taskType, storyStatus, bugStatus, taskStatus] = await Promise.all([
      API.getStoryType(prefix, scopeId),
      { BUG: 'bug' } as Record<string, string>,
      { TASK: 'task' } as Record<string, string>,
      API.getStatus(prefix, scopeId, 'story'),
      API.getStatus(prefix, scopeId, 'bug'),
      { open: 'task-open', progressing: 'task-progressing', done: 'task-done' } as Record<string, string>,
    ]);

    function pushIntoList(all: { id: string; name: string }[], data: Record<string, string>) {
      for (let id in data) {
        let existItem = all.find((it) => it.id === id);
        if (existItem) {
          existItem.name = `${existItem.name}, ${data[id]}`;
        } else {
          all.push({ id, name: data[id] });
        }
      }
    }
    const statusList: { id: string; name: string }[] = [];
    pushIntoList(statusList, storyStatus.data);
    pushIntoList(statusList, bugStatus.data);
    pushIntoList(statusList, taskStatus);

    const typeList: { id: string; name: string }[] = [];
    typeList.push(...storyType.data.map((it: any) => ({ id: it.Category.id, name: it.Category.name })));
    pushIntoList(typeList, bugType);
    pushIntoList(typeList, taskType);

    return {
      statusList,
      typeList,
    };
  }, [prefix]);

  useEffect(() => {
    const typeList = Object.entries(transformation.typeMappings ?? {}).map(([key, value]: any) => ({ key, value }));
    setFeatureTypeList(typeList.filter((it) => it.value === StandardType.Feature).map((it) => it.key));
    setBugTypeList(typeList.filter((it) => it.value === StandardType.Bug).map((it) => it.key));
    setIncidentTypeList(typeList.filter((it) => it.value === StandardType.Incident).map((it) => it.key));

    const statusList = Object.entries(transformation.statusMappings ?? {}).map(([key, value]: any) => ({ key, value }));
    setTodoStatusList(statusList.filter((it) => it.value === StandardStatus.Todo).map((it) => it.key));
    setInProgressStatusList(statusList.filter((it) => it.value === StandardStatus.InProgress).map((it) => it.key));
    setDoneStatusList(statusList.filter((it) => it.value === StandardStatus.Done).map((it) => it.key));
  }, [transformation]);

  if (!ready || !data) {
    return <PageLoading />;
  }

  const { statusList, typeList } = data;

  const transformaType = (its: string[], standardType: string) => {
    return its.reduce((acc, cur) => {
      acc[cur] = standardType;
      return acc;
    }, {} as Record<string, string>);
  };
  return (
    <S.TransformationWrapper>
      {/* Issue Tracking */}
      <div className="issue-tracking">
        <h2>Issue Tracking</h2>
        <div className="issue-type">
          <div className="title">
            <span>Issue Type Mapping</span>
            <HelpTooltip content="Standardize your issue types to the following issue types to view metrics such as `Requirement lead time` and `Bug age` in built-in dashboards." />
          </div>
          <div className="list">
            <FormGroup inline label="Feature">
              <MultiSelector
                items={typeList}
                disabledItems={typeList.filter((v) => [...bugTypeList, ...incidentTypeList].includes(v.id))}
                getKey={(it) => it.id}
                getName={(it) => it.name}
                selectedItems={typeList.filter((v) => featureTypeList.includes(v.id))}
                onChangeItems={(selectedItems) =>
                  setTransformation({
                    ...transformation,
                    typeMappings: {
                      ...transformaType(
                        selectedItems.map((v) => v.id),
                        StandardType.Feature,
                      ),
                      ...transformaType(bugTypeList, StandardType.Bug),
                      ...transformaType(incidentTypeList, StandardType.Incident),
                    },
                  })
                }
              />
            </FormGroup>
            <FormGroup inline label="Bug">
              <MultiSelector
                items={typeList}
                disabledItems={typeList.filter((v) => [...featureTypeList, ...incidentTypeList].includes(v.id))}
                getKey={(it) => it.id}
                getName={(it) => it.name}
                selectedItems={typeList.filter((v) => bugTypeList.includes(v.id))}
                onChangeItems={(selectedItems) =>
                  setTransformation({
                    ...transformation,
                    typeMappings: {
                      ...transformaType(featureTypeList, StandardType.Feature),
                      ...transformaType(
                        selectedItems.map((v) => v.id),
                        StandardType.Bug,
                      ),
                      ...transformaType(incidentTypeList, StandardType.Incident),
                    },
                  })
                }
              />
            </FormGroup>
            <FormGroup
              inline
              label={
                <>
                  <span>Incident</span>
                  <Tag intent={Intent.PRIMARY} style={{ marginLeft: 4 }}>
                    DORA
                  </Tag>
                </>
              }
            >
              <MultiSelector
                items={typeList}
                disabledItems={typeList.filter((v) => [...featureTypeList, ...bugTypeList].includes(v.id))}
                getKey={(it) => it.id}
                getName={(it) => it.name}
                selectedItems={typeList.filter((v) => incidentTypeList.includes(v.id))}
                onChangeItems={(selectedItems) =>
                  setTransformation({
                    ...transformation,
                    typeMappings: {
                      ...transformaType(featureTypeList, StandardType.Feature),
                      ...transformaType(bugTypeList, StandardType.Bug),
                      ...transformaType(
                        selectedItems.map((v) => v.id),
                        StandardType.Incident,
                      ),
                    },
                  })
                }
              />
            </FormGroup>
          </div>
        </div>
        <div className="issue-status">
          <div className="title">
            <span>Issue Status Mapping</span>
            <HelpTooltip content="Standardize your issue statuses to the following issue statuses to view metrics such as `Requirement Delivery Rate` in built-in dashboards." />
          </div>
          <div className="list">
            <FormGroup inline label="TODO">
              <MultiSelector
                items={statusList}
                disabledItems={statusList.filter((v) => [...inProgressStatusList, ...doneStatusList].includes(v.id))}
                getKey={(it) => it.id}
                getName={(it) => it.name}
                selectedItems={statusList.filter((v) => todoStatusList.includes(v.id))}
                onChangeItems={(selectedItems) =>
                  setTransformation({
                    ...transformation,
                    statusMappings: {
                      ...transformaType(
                        selectedItems.map((v) => v.id),
                        StandardStatus.Todo,
                      ),
                      ...transformaType(inProgressStatusList, StandardStatus.InProgress),
                      ...transformaType(doneStatusList, StandardStatus.Done),
                    },
                  })
                }
              />
            </FormGroup>
            <FormGroup inline label="IN-PROGRESS">
              <MultiSelector
                items={statusList}
                disabledItems={statusList.filter((v) => [...todoStatusList, ...doneStatusList].includes(v.id))}
                getKey={(it) => it.id}
                getName={(it) => it.name}
                selectedItems={statusList.filter((v) => inProgressStatusList.includes(v.id))}
                onChangeItems={(selectedItems) =>
                  setTransformation({
                    ...transformation,
                    statusMappings: {
                      ...transformaType(todoStatusList, StandardStatus.Todo),
                      ...transformaType(
                        selectedItems.map((v) => v.id),
                        StandardStatus.InProgress,
                      ),
                      ...transformaType(doneStatusList, StandardStatus.Done),
                    },
                  })
                }
              />
            </FormGroup>
            <FormGroup inline label="DONE">
              <MultiSelector
                items={statusList}
                disabledItems={statusList.filter((v) => [...todoStatusList, ...inProgressStatusList].includes(v.id))}
                getKey={(it) => it.id}
                getName={(it) => it.name}
                selectedItems={statusList.filter((v) => doneStatusList.includes(v.id))}
                onChangeItems={(selectedItems) =>
                  setTransformation({
                    ...transformation,
                    statusMappings: {
                      ...transformaType(todoStatusList, StandardStatus.Todo),
                      ...transformaType(inProgressStatusList, StandardStatus.InProgress),
                      ...transformaType(
                        selectedItems.map((v) => v.id),
                        StandardStatus.Done,
                      ),
                    },
                  })
                }
              />
            </FormGroup>
          </div>
        </div>
      </div>
      <Divider />
      {/* Cross-domain */}
      <div>
        <h2>Cross-domain</h2>
        <p>
          Connect `commits` and `issues` to measure metrics such as{' '}
          <ExternalLink link="https://devlake.apache.org/docs/Metrics/BugCountPer1kLinesOfCode">
            Bug Count per 1k Lines of Code
          </ExternalLink>{' '}
          or man hour distribution on different work types.
        </p>
        <FormGroup
          inline
          label={
            <>
              <span>Connect Commits and Tapd Issues</span>
              <HelpTooltip
                content={
                  <div>
                    If you are using remote links to connect commits and issues, you can specify the commit SHA pattern.
                    DevLake will parse the commit_sha from your tapd issues’ remote/web links and store the relationship
                    in the table `issue_commits`.
                  </div>
                }
              />
            </>
          }
        >
          <InputGroup
            fill
            placeholder="/commit/([0-9a-f]{40})$"
            value={transformation.remotelinkCommitShaPattern ?? ''}
            onChange={(e) =>
              setTransformation({
                ...transformation,
                remotelinkCommitShaPattern: e.target.value,
              })
            }
          />
        </FormGroup>
      </div>
    </S.TransformationWrapper>
  );
};
