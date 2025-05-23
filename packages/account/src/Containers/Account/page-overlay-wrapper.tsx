import React from 'react';
import { useHistory } from 'react-router-dom';
import { Analytics } from '@deriv-com/analytics';
import { PageOverlay, VerticalTab } from '@deriv/components';
import { getOSNameWithUAParser, getSelectedRoute, routes as shared_routes, platforms } from '@deriv/shared';
import { observer, useStore } from '@deriv/stores';
import { Localize } from '@deriv/translations';
import TradingHubLogout from './tradinghub-logout';
import { TRoute } from '../../Types';
import { useDevice } from '@deriv-com/ui';

type RouteItems = React.ComponentProps<typeof VerticalTab>['list'];

type PageOverlayWrapperProps = {
    routes: Array<TRoute>;
    subroutes: TRoute[];
};

/**
 * @name PageOverlayWrapper
 * @param routes - routes object pased by react-router-dom
 * @param subroutes - list of subroutes
 */
const PageOverlayWrapper = observer(({ routes, subroutes }: PageOverlayWrapperProps) => {
    const history = useHistory();
    const { client, common, ui } = useStore();
    const { logout, setIsLoggingOut } = client;
    const { is_from_derivgo, is_from_tradershub_os, is_from_derivp2p } = common;
    const { setIsForcedToExitPnv } = ui;
    const { isDesktop } = useDevice();

    const passkeysMenuCloseActionEventTrack = React.useCallback(() => {
        Analytics.trackEvent('ce_passkey_account_settings_form', {
            action: 'close',
            form_name: 'ce_passkey_account_settings_form',
            operating_system: getOSNameWithUAParser(),
        });
    }, []);

    const list_groups = routes.map(route_group => ({
        icon: route_group.icon,
        label: route_group?.getTitle?.(),
        subitems: route_group?.subroutes?.length ? route_group.subroutes.map(sub => subroutes.indexOf(sub)) : [],
    }));

    const onClickClose = React.useCallback(() => {
        if (location.pathname === shared_routes.passkeys) {
            passkeysMenuCloseActionEventTrack();
        }

        history.push(shared_routes.traders_hub);
    }, [history]);

    //@ts-expect-error as component type conflicts with VerticalTab type
    const selected_route = getSelectedRoute({ routes: subroutes, pathname: location.pathname });

    const onClickLogout = async () => {
        setIsLoggingOut(true);
        if (window.location.pathname.startsWith(shared_routes.phone_verification)) {
            setIsForcedToExitPnv(true);
            // Add a small delay to ensure state is updated before navigation because adding await doesn't work here
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        history.push(shared_routes.traders_hub);
        await logout();
    };

    if (!isDesktop && selected_route) {
        const RouteComponent = selected_route.component as React.ElementType<{ component_icon: string | undefined }>;
        return (
            <PageOverlay
                header={selected_route?.getTitle?.()}
                onClickClose={onClickClose}
                is_from_app={is_from_derivgo}
                is_from_derivp2p={is_from_derivp2p}
                is_from_tradershub_os={is_from_tradershub_os}
            >
                <RouteComponent component_icon={selected_route.icon_component} />
            </PageOverlay>
        );
    }

    return (
        <PageOverlay
            header={<Localize i18n_default_text='Settings' />}
            onClickClose={onClickClose}
            is_from_app={is_from_derivgo}
            is_from_derivp2p={is_from_derivp2p}
            is_from_tradershub_os={is_from_tradershub_os}
        >
            <VerticalTab
                is_floating
                current_path={location.pathname}
                is_routed
                is_full_width
                list={subroutes as RouteItems}
                list_groups={list_groups}
                extra_content={<TradingHubLogout handleOnLogout={onClickLogout} />}
                is_sidebar_enabled={isDesktop}
            />
        </PageOverlay>
    );
});

PageOverlayWrapper.displayName = 'PageOverlayWrapper';

export default PageOverlayWrapper;
