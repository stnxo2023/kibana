/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useMemo, ReactNode } from 'react';
import { createHtmlPortalNode, InPortal, OutPortal } from 'react-reverse-portal';
// FIXME use import { toMountPoint } from '@kbn/react-kibana-mount';
import { toMountPoint } from '@kbn/kibana-react-plugin/public';
import { AppMountParameters } from '@kbn/core/public';

export interface HeaderMenuPortalProps {
  children: ReactNode;
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  theme$: AppMountParameters['theme$'];
}

// eslint-disable-next-line import/no-default-export
export default function HeaderMenuPortal({
  children,
  setHeaderActionMenu,
  theme$,
}: HeaderMenuPortalProps) {
  const portalNode = useMemo(() => createHtmlPortalNode(), []);

  useEffect(() => {
    setHeaderActionMenu((element) => {
      const mount = toMountPoint(<OutPortal node={portalNode} />, { theme$ });
      return mount(element);
    });

    return () => {
      portalNode.unmount();
      setHeaderActionMenu(undefined);
    };
  }, [portalNode, setHeaderActionMenu, theme$]);

  return <InPortal node={portalNode}>{children}</InPortal>;
}
