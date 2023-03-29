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

	"github.com/apache/incubator-devlake/core/errors"
	"github.com/apache/incubator-devlake/core/models/common"
	"github.com/apache/incubator-devlake/core/plugin"
	helper "github.com/apache/incubator-devlake/helpers/pluginhelper/api"
	aha "github.com/apache/incubator-devlake/helpers/pluginhelper/api/apihelperabstract"
	mockplugin "github.com/apache/incubator-devlake/mocks/core/plugin"
	mockaha "github.com/apache/incubator-devlake/mocks/helpers/pluginhelper/api/apihelperabstract"
	"github.com/apache/incubator-devlake/plugins/github/models"
	"github.com/apache/incubator-devlake/plugins/github/tasks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

var repo = &tasks.GithubApiRepo{
	GithubId:  12345,
	CloneUrl:  "https://this_is_cloneUrl",
	CreatedAt: helper.Iso8601Time{},
}

func TestMakePipelinePlan(t *testing.T) {
	var bs = &plugin.BlueprintScopeV100{
		Entities: []string{"CODE"},
		Options: json.RawMessage(`{
              "owner": "test",
              "repo": "testRepo"
            }`),
		Transformation: json.RawMessage(`{
              "prType": "hey,man,wasup",
              "refdiff": {
                "tagsPattern": "pattern",
                "tagsLimit": 10,
                "tagsOrder": "reverse semver"
              },
              "productionPattern": "xxxx"
            }`),
	}
	prepareMockMeta(t)
	mockApiClient := prepareMockClient(t, repo)
	connection := &models.GithubConnection{
		BaseConnection: helper.BaseConnection{
			Name: "github-test",
			Model: common.Model{
				ID: 1,
			},
		},
		GithubConn: models.GithubConn{
			RestConnection: helper.RestConnection{
				Endpoint:         "https://api.github.com/",
				Proxy:            "",
				RateLimitPerHour: 0,
			},
			GithubAccessToken: models.GithubAccessToken{
				AccessToken: helper.AccessToken{
					Token: "123",
				},
			},
		},
	}
	scopes := make([]*plugin.BlueprintScopeV100, 0)
	scopes = append(scopes, bs)
	plan, err := makePipelinePlan(nil, scopes, mockApiClient, connection)
	assert.Nil(t, err)

	expectPlan := plugin.PipelinePlan{
		plugin.PipelineStage{
			{
				Plugin:   "github",
				Subtasks: []string{},
				Options: map[string]interface{}{
					"connectionId": uint64(1),
					"owner":        "test",
					"repo":         "testRepo",
					"transformationRules": map[string]interface{}{
						"prType":            "hey,man,wasup",
						"productionPattern": "xxxx",
					},
				},
			},
			{
				Plugin: "gitextractor",
				Options: map[string]interface{}{
					"proxy":  "",
					"repoId": "github:GithubRepo:1:12345",
					"url":    "https://git:123@this_is_cloneUrl",
				},
			},
		},
		plugin.PipelineStage{
			{
				Plugin: "refdiff",
				Options: map[string]interface{}{
					"repoId":      "github:GithubRepo:1:12345",
					"tagsLimit":   float64(10),
					"tagsOrder":   "reverse semver",
					"tagsPattern": "pattern",
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

func TestMemorizedGetApiRepo(t *testing.T) {
	op := prepareOptions(t)
	expect := repo
	repo1, err := MemorizedGetApiRepo(repo, op, nil)
	assert.Nil(t, err)
	assert.Equal(t, expect, repo1)
	mockApiClient := prepareMockClient(t, repo)
	repo2, err := MemorizedGetApiRepo(nil, op, mockApiClient)
	assert.Nil(t, err)
	assert.NotEqual(t, expect, repo2)
}

func TestGetApiRepo(t *testing.T) {
	op := prepareOptions(t)
	mockClient := prepareMockClient(t, repo)
	repo1, err := getApiRepo(op, mockClient)
	assert.Nil(t, err)
	assert.Equal(t, repo.GithubId, repo1.GithubId)
}

func prepareMockMeta(t *testing.T) {
	mockMeta := mockplugin.NewPluginMeta(t)
	mockMeta.On("RootPkgPath").Return("github.com/apache/incubator-devlake/plugins/github")
	err := plugin.RegisterPlugin("github", mockMeta)
	assert.Nil(t, err)
}

func prepareMockClient(t *testing.T, repo *tasks.GithubApiRepo) aha.ApiClientAbstract {
	mockApiCLient := mockaha.NewApiClientAbstract(t)
	js, err := json.Marshal(repo)
	assert.Nil(t, err)
	res := &http.Response{}
	res.Body = io.NopCloser(bytes.NewBuffer(js))
	res.StatusCode = http.StatusOK
	mockApiCLient.On("Get", "repos/test/testRepo", mock.Anything, mock.Anything).Return(res, nil)
	return mockApiCLient
}

func prepareOptions(t *testing.T) *tasks.GithubOptions {
	var bs = &plugin.BlueprintScopeV100{
		Entities: []string{"CODE"},
		Options: json.RawMessage(`{
              "owner": "test",
              "repo": "testRepo"
            }`),
		Transformation: json.RawMessage(`{
              "prType": "hey,man,wasup",
              "refdiff": {
                "tagsPattern": "pattern",
                "tagsLimit": 10,
                "tagsOrder": "reverse semver"
              },
              "productionPattern": "xxxx"
            }`),
	}
	options := make(map[string]interface{})
	err := errors.Convert(json.Unmarshal(bs.Options, &options))
	assert.Nil(t, err)
	options["connectionId"] = 1
	// make sure task options is valid
	op, err := tasks.DecodeAndValidateTaskOptions(options)
	assert.Nil(t, err)
	return op
}
