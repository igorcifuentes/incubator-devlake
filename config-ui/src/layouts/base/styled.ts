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

import styled from 'styled-components';
import { Navbar } from '@blueprintjs/core';

export const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f9f9fa;
  overflow: hidden;
`;

export const Sider = styled.div`
  flex: 0 0 200px;
  position: relative;
  padding: 20px 0;
  width: 200px;
  background-color: #292b3f;

  .menu {
    margin: 20px 4px 0;
    color: #fff;
    background-color: transparent;

    .menu-item,
    .sub-menu-item {
      display: flex;
      align-items: center;
      margin: 2px 0;
      line-height: 26px;
      transition: all 0.3s ease;
      border-radius: 8px;
      outline: none;
      cursor: pointer;

      &:hover {
        background-color: rgba(167, 182, 194, 0.3);
      }

      .bp4-icon {
        svg {
          width: 12px;
          height: 12px;
        }
      }
    }

    .sub-menu-item {
      border-radius: 3px;
    }
  }

  .copyright {
    position: absolute;
    right: 0;
    bottom: 30px;
    left: 0;
    text-align: center;
    color: rgba(124, 124, 124, 0.7);
    padding: 0 20px;
    .version {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;

export const Inner = styled.div`
  display: flex;
  flex-direction: column;
  flex: auto;
  height: 100vh;
  overflow: auto;
`;

export const Header = styled(Navbar)`
  flex: 0 0 50px;
  background-color: #f9f9fa;
  box-shadow: none;

  a {
    display: flex;
    align-items: center;

    img {
      margin-right: 4px;
      width: 16px;
    }

    span {
      font-size: 12px;
    }
  }
`;

export const Content = styled.div`
  flex: auto;
  margin: 24px auto;
  max-width: 900px;
  width: 100%;
`;

export const SiderMenuItem = styled.div`
  display: flex;
  align-items: center;

  & > .bp4-tag {
    margin-left: 8px;
  }
`;

export const BorderContainer = styled.div`
  border: 1px solid #7497f7;
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
`;
