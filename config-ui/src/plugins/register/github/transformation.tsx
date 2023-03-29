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
import {
  FormGroup,
  InputGroup,
  TextArea,
  Tag,
  RadioGroup,
  Radio,
  Icon,
  Collapse,
  Intent,
  Colors,
} from '@blueprintjs/core';

import { ExternalLink, HelpTooltip, Divider } from '@/components';

import * as S from './styled';

interface Props {
  transformation: any;
  setTransformation: React.Dispatch<React.SetStateAction<any>>;
}

export const GitHubTransformation = ({ transformation, setTransformation }: Props) => {
  const [enableCICD, setEnableCICD] = useState(1);
  const [openAdditionalSettings, setOpenAdditionalSettings] = useState(false);

  useEffect(() => {
    if (transformation.refdiff) {
      setOpenAdditionalSettings(true);
    }
  }, [transformation]);

  const handleChangeCICDEnable = (e: number) => {
    if (e === 0) {
      setTransformation({
        ...transformation,
        deploymentPattern: undefined,
        productionPattern: undefined,
      });
    } else {
      setTransformation({
        ...transformation,
        deploymentPattern: '',
        productionPattern: '',
      });
    }
    setEnableCICD(e);
  };

  const handleChangeAdditionalSettingsOpen = () => {
    setOpenAdditionalSettings(!openAdditionalSettings);
    if (!openAdditionalSettings) {
      setTransformation({
        ...transformation,
        refdiff: null,
      });
    }
  };

  return (
    <S.TransformationWrapper>
      {/* Issue Tracking */}
      <div className="issue-tracking">
        <h2>Issue Tracking</h2>
        <p>
          Tell DevLake what your issue labels mean to view metrics such as{' '}
          <ExternalLink link="https://devlake.apache.org/docs/Metrics/BugAge">Bug Age</ExternalLink>,{' '}
          <ExternalLink link="https://devlake.apache.org/docs/Metrics/MTTR">
            DORA - Median Time to Restore Service
          </ExternalLink>
          , etc.
        </p>
        <div className="issue-type">
          <div className="title">
            <span>Issue Type</span>
            <HelpTooltip content="DevLake defines three standard types of issues: FEATURE, BUG and INCIDENT. Set your issues to these three types with issue labels that match the RegEx." />
          </div>
          <div className="list">
            <FormGroup inline label="Feature">
              <InputGroup
                placeholder="(feat|feature|proposal|requirement)"
                value={transformation.issueTypeRequirement ?? ''}
                onChange={(e) =>
                  setTransformation({
                    ...transformation,
                    issueTypeRequirement: e.target.value,
                  })
                }
              />
            </FormGroup>
            <FormGroup inline label="Bug">
              <InputGroup
                placeholder="(bug|broken)"
                value={transformation.issueTypeBug ?? ''}
                onChange={(e) =>
                  setTransformation({
                    ...transformation,
                    issueTypeBug: e.target.value,
                  })
                }
              />
            </FormGroup>
            <FormGroup
              inline
              label={
                <span>
                  Incident
                  <Tag minimal intent={Intent.PRIMARY} style={{ marginLeft: 4 }}>
                    DORA
                  </Tag>
                </span>
              }
            >
              <InputGroup
                placeholder="(incident|failure)"
                value={transformation.issueTypeIncident ?? ''}
                onChange={(e) =>
                  setTransformation({
                    ...transformation,
                    issueTypeIncident: e.target.value,
                  })
                }
              />
            </FormGroup>
          </div>
        </div>
        <FormGroup
          inline
          label={
            <>
              <span>Issue Priority</span>
              <HelpTooltip content="Labels that match the RegEx will be set as the priority of an issue." />
            </>
          }
        >
          <InputGroup
            placeholder="(highest|high|medium|low|p0|p1|p2|p3)"
            value={transformation.issuePriority ?? ''}
            onChange={(e) =>
              setTransformation({
                ...transformation,
                issuePriority: e.target.value,
              })
            }
          />
        </FormGroup>
        <FormGroup
          inline
          label={
            <>
              <span>Issue Component</span>
              <HelpTooltip content="Labels that match the RegEx will be set as the component of an issue." />
            </>
          }
        >
          <InputGroup
            placeholder="component(.*)"
            value={transformation.issueComponent ?? ''}
            onChange={(e) =>
              setTransformation({
                ...transformation,
                issueComponent: e.target.value,
              })
            }
          />
        </FormGroup>
        <FormGroup
          inline
          label={
            <>
              <span>Issue Severity</span>
              <HelpTooltip content="Labels that match the RegEx will be set as the serverity of an issue." />
            </>
          }
        >
          <InputGroup
            placeholder="severity(.*)"
            value={transformation.issueSeverity ?? ''}
            onChange={(e) =>
              setTransformation({
                ...transformation,
                issueSeverity: e.target.value,
              })
            }
          />
        </FormGroup>
      </div>
      <Divider />
      {/* CI/CD */}
      <div className="ci-cd">
        <h2>CI/CD</h2>
        <h3>
          <span>Deployment</span>
          <Tag minimal intent={Intent.PRIMARY}>
            DORA
          </Tag>
        </h3>
        <p>Tell DevLake what CI jobs are Deployments.</p>
        <RadioGroup
          selectedValue={enableCICD}
          onChange={(e) => handleChangeCICDEnable(+(e.target as HTMLInputElement).value)}
        >
          <Radio label="Detect Deployment from Jobs in GitHub Action" value={1} />
          {enableCICD === 1 && (
            <div className="radio">
              <p>
                Please fill in the following RegEx, as DevLake ONLY accounts for deployments in the production
                environment for DORA metrics. Not sure what a GitHub Action job is?{' '}
                <ExternalLink link="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow">
                  See it here
                </ExternalLink>
              </p>
              <div className="input">
                <p>The Job name that matches</p>
                <InputGroup
                  placeholder="(deploy|push-image)"
                  value={transformation.deploymentPattern ?? ''}
                  onChange={(e) =>
                    setTransformation({
                      ...transformation,
                      deploymentPattern: e.target.value,
                    })
                  }
                />
                <p>
                  will be registered as a `Deployment` in DevLake. <span style={{ color: '#E34040' }}>*</span>
                </p>
              </div>
              <div className="input">
                <p>The Job name that matches</p>
                <InputGroup
                  disabled={!transformation.deploymentPattern}
                  placeholder="production"
                  value={transformation.productionPattern ?? ''}
                  onChange={(e) =>
                    setTransformation({
                      ...transformation,
                      productionPattern: e.target.value,
                    })
                  }
                />
                <p>
                  will be registered as a `Deployment` to the Production environment in DevLake.
                  <HelpTooltip content="If you leave this field empty, all data will be tagged as in the Production environment. " />
                </p>
              </div>
            </div>
          )}
          <Radio label="Not using any GitHub entities as Deployment" value={0} />
        </RadioGroup>
      </div>
      <Divider />
      {/* Code Review */}
      <div>
        <h2>Code Review</h2>
        <p>
          If you use labels to identify types and components of pull requests, use the following RegExes to extract them
          into corresponding columns.{' '}
          <ExternalLink link="https://devlake.apache.org/docs/DataModels/DevLakeDomainLayerSchema#pull_requests">
            Learn More
          </ExternalLink>
        </p>
        <FormGroup
          inline
          label={
            <>
              <span>PR Type</span>
              <HelpTooltip content="Labels that match the RegEx will be set as the type of a pull request." />
            </>
          }
        >
          <InputGroup
            placeholder="type(.*)$"
            value={transformation.prType ?? ''}
            onChange={(e) => setTransformation({ ...transformation, prType: e.target.value })}
          />
        </FormGroup>
        <FormGroup
          inline
          label={
            <>
              <span>PR Component</span>
              <HelpTooltip content="Labels that match the RegEx will be set as the component of a pull request." />
            </>
          }
        >
          <InputGroup
            placeholder="component(.*)$"
            value={transformation.prComponent ?? ''}
            onChange={(e) =>
              setTransformation({
                ...transformation,
                prComponent: e.target.value,
              })
            }
          />
        </FormGroup>
      </div>
      <Divider />
      {/* Cross-domain */}
      <div>
        <h2>Cross-domain</h2>
        <p>
          Connect entities across domains to measure metrics such as{' '}
          <ExternalLink link="https://devlake.apache.org/docs/Metrics/BugCountPer1kLinesOfCode">
            Bug Count per 1k Lines of Code
          </ExternalLink>
          .
        </p>
        <FormGroup
          inline
          label={
            <div className="label">
              <span>Connect PRs and Issues</span>
              <HelpTooltip
                content={
                  <>
                    <div>
                      <Icon icon="tick-circle" size={12} color={Colors.GREEN4} style={{ marginRight: '4px' }} />
                      Example 1: PR #321 body contains "<strong>Closes #1234</strong>" (PR #321 and issue #1234 will be
                      mapped by the following RegEx)
                    </div>
                    <div>
                      <Icon icon="delete" size={12} color={Colors.RED4} style={{ marginRight: '4px' }} />
                      Example 2: PR #321 body contains "<strong>Related to #1234</strong>" (PR #321 and issue #1234 will
                      NOT be mapped by the following RegEx)
                    </div>
                  </>
                }
              />
            </div>
          }
        >
          <TextArea
            value={transformation.prBodyClosePattern ?? ''}
            placeholder="(?mi)(fix|close|resolve|fixes|closes|resolves|fixed|closed|resolved)[s]*.*(((and )?(#|https://github.com/%s/%s/issues/)d+[ ]*)+)"
            onChange={(e) =>
              setTransformation({
                ...transformation,
                prBodyClosePattern: e.target.value,
              })
            }
            fill
            rows={2}
          />
        </FormGroup>
      </div>
      <Divider />
      {/* Additional Settings */}
      <div className="additional-settings">
        <h2 onClick={handleChangeAdditionalSettingsOpen}>
          <Icon icon={!openAdditionalSettings ? 'chevron-up' : 'chevron-down'} size={18} />
          <span>Additional Settings</span>
        </h2>
        <Collapse isOpen={openAdditionalSettings}>
          <div className="radio">
            <Radio defaultChecked />
            <p>
              Enable the <ExternalLink link="https://devlake.apache.org/docs/Plugins/refdiff">RefDiff</ExternalLink>{' '}
              plugin to pre-calculate version-based metrics
              <HelpTooltip content="Calculate the commits diff between two consecutive tags that match the following RegEx. Issues closed by PRs which contain these commits will also be calculated. The result will be shown in table.refs_commits_diffs and table.refs_issues_diffs." />
            </p>
          </div>
          <div className="refdiff">
            Compare the last
            <InputGroup
              style={{ width: 60 }}
              value={transformation.refdiff?.tagsOrder ?? ''}
              onChange={(e) =>
                setTransformation({
                  ...transformation,
                  refdiff: {
                    ...transformation?.refdiff,
                    tagsOrder: e.target.value,
                  },
                })
              }
            />
            tags that match the
            <InputGroup
              style={{ width: 200 }}
              placeholder="(regex)$"
              value={transformation.refdiff?.tagsPattern ?? ''}
              onChange={(e) =>
                setTransformation({
                  ...transformation,
                  refdiff: {
                    ...transformation?.refdiff,
                    tagsPattern: e.target.value,
                  },
                })
              }
            />
            for calculation
          </div>
        </Collapse>
      </div>
    </S.TransformationWrapper>
  );
};
