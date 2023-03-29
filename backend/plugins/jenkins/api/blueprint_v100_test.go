/*
Licensed to the Apache Software Foundation (ASF) under one or more
contributor license agreements.  See the NOTICE file distributed with
this work for additional information regarding copyright ownership.
The ASF licenses this file to You under the Apache License, Version 2.0
(the "License"); you may not use this file except in compliance with
the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"testing"

	mockaha "github.com/apache/incubator-devlake/mocks/helpers/pluginhelper/api/apihelperabstract"

	"github.com/apache/incubator-devlake/core/models/common"
	"github.com/apache/incubator-devlake/core/plugin"
	helper "github.com/apache/incubator-devlake/helpers/pluginhelper/api"
	"github.com/apache/incubator-devlake/plugins/jenkins/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestProcessScope(t *testing.T) {
	connection := &models.JenkinsConnection{
		BaseConnection: helper.BaseConnection{
			Name: "jenkins-test",
			Model: common.Model{
				ID: 1,
			},
		},
		JenkinsConn: models.JenkinsConn{
			RestConnection: helper.RestConnection{
				Endpoint:         "https://api.github.com/",
				Proxy:            "",
				RateLimitPerHour: 0,
			},
			BasicAuth: helper.BasicAuth{
				Username: "Username",
				Password: "Password",
			},
		},
	}

	bs := &plugin.BlueprintScopeV100{
		Entities: []string{"CICD"},
		Options:  json.RawMessage(`{}`),
		Transformation: json.RawMessage(`{
              "productionPattern": "(?i)build-and-deploy",
              "deploymentPattern": "deploy"
            }`),
	}
	scopes := make([]*plugin.BlueprintScopeV100, 0)
	scopes = append(scopes, bs)

	mockApiClient := mockaha.NewApiClientAbstract(t)

	var remoteData = []*models.Job{
		{
			Name:        "devlake",
			Color:       "blue",
			Class:       "hudson.model.FreeStyleProject",
			Base:        "",
			URL:         "https://test.nddtf.com/job/devlake/",
			Description: "",
		},
	}

	var data struct {
		Jobs []json.RawMessage `json:"jobs"`
	}

	// job to apiClient
	js, err1 := json.Marshal(remoteData[0])
	assert.Nil(t, err1)
	data.Jobs = append(data.Jobs, js)

	js, err1 = json.Marshal(data)
	assert.Nil(t, err1)

	res := &http.Response{}
	res.Body = io.NopCloser(bytes.NewBuffer(js))
	res.StatusCode = http.StatusOK

	mockApiClient.On("Get", mock.Anything, mock.Anything, mock.Anything).Return(res, nil).Once()

	plan, err := makePipelinePlanV100(nil, scopes, connection, mockApiClient)
	assert.Nil(t, err)

	expectPlan := plugin.PipelinePlan{
		plugin.PipelineStage{
			{
				Plugin:   "jenkins",
				Subtasks: []string{},
				Options: map[string]interface{}{
					"jobFullName":  "devlake",
					"connectionId": uint64(1),
					"transformationRules": map[string]interface{}{
						"deploymentPattern": "deploy",
					},
				},
			},
		},
		plugin.PipelineStage{
			{
				Plugin:   "dora",
				Subtasks: []string{"EnrichTaskEnv"},
				Options:  map[string]interface{}{},
			},
		},
	}
	assert.Equal(t, expectPlan, plan)
}
