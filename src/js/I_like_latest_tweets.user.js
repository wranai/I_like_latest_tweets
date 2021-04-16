// ==UserScript==
// @name            I like latest tweets !
// @name:ja         最新ツイート表示が好き！
// @namespace       https://furyutei.work
// @license         MIT
// @version         0.0.3
// @description     Switch to latest tweets view when Twitter home-timeline go back "Home" view.
// @description:ja  Twitterのタイムラインが「ホーム」表示になった際、最新ツイート表示に切り替え
// @author          furyu
// @match           https://twitter.com/*
// @match           https://mobile.twitter.com/*
// @noframes
// @grant           none
// @compatible      chrome
// @compatible      firefox
// @supportURL      https://github.com/furyutei/I_like_latest_tweets/issues
// @contributionURL https://memo.furyutei.work/about#send_donation
// ==/UserScript==

( async () => {
'use strict';

const
    SCRIPT_NAME = 'I_like_latest_tweets',
    
    self = undefined,
    
    log_debug = ( ... args ) => {
        console.debug( '%c[' + SCRIPT_NAME + '] ' + new Date().toISOString(), 'color: gray;', ... args );
    },
    
    log = ( ... args ) => {
        console.log( '%c[' + SCRIPT_NAME + '] ' + new Date().toISOString(), 'color: teal;', ... args );
    },
    
    log_error = ( ... args ) => {
        console.error( '%c[' + SCRIPT_NAME + '] ' + new Date().toISOString(), 'color: purple;', ... args );
    };


let KEYSTRING_MAP = await ( async () => {
        const
            I18N_SCRIPT_SELECTOR = 'script[src*="/i18n/"]',
            TOP_TWEETS_ON_KEY = 'ccdd3766',
            SEE_LATEST_TWEETS_INSTEAD_KEY = 'j6382fe9',
            // TODO: キーが変更されると動作しなくなる
            
            get_reg = ( key ) => {
                return new RegExp( '\\(\\s*"' + key + '"\\s*,\\s*"([^"]+)"\\s*\\)' );
            };
        
        return Promise.resolve()
            .then( () => {
                return fetch( document.querySelector( I18N_SCRIPT_SELECTOR ).src )
                    .then( response => response.text() )
                    .then( text => {
                        return Promise.resolve( {
                            top_tweets_on : text.match( get_reg( TOP_TWEETS_ON_KEY ) )[ 1 ],
                            see_latest_tweets_instead : text.match( get_reg( SEE_LATEST_TWEETS_INSTEAD_KEY ) )[ 1 ],
                        } );
                    } );
            } )
            .catch( error => {
                log_error( error );
                return Promise.resolve( null )
            } );
    } )();

log_debug( 'KEYSTRING_MAP:', KEYSTRING_MAP );

if ( ! KEYSTRING_MAP ) {
    log_error( 'Failed to obtain key-strings.' );
    
    switch ( document.documentElement.lang ) {
        case 'ja' :
            KEYSTRING_MAP = {
                top_tweets_on : 'トップツイートがオンになります',
                see_latest_tweets_instead : '最新ツイート表示に切り替える',
            };
            break;
        
        case 'en' :
            KEYSTRING_MAP = {
                top_tweets_on : 'Top Tweets off',
                see_latest_tweets_instead : 'See latest Tweets instead',
            };
            break;
        
        default :
            return;
    }
}


const
    FixToLatestTweetTimeline = new class {
        constructor( keystring_map ) {
            this.status = 'idle';
            this.keystring_map = keystring_map;
            this.update_status();
        }
        
        update_status() {
            let self = this;
            
            switch ( self.status ) {
                case 'idle' : {
                    let home_mode_button = self.get_home_mode_button();
                    
                    if ( ! home_mode_button ) {
                        break;
                    }
                    
                    switch ( document.documentElement.lang ) {
                        case 'ja' :
                            log( '「ホーム」表示を検知！最新ツイート表示へ切り変えます！' );
                            break;
                        
                        default :
                            log( '"Home" view is detected ! It will switch to latest tweets view !' );
                            break;
                    }
                    
                    home_mode_button.click();
                    
                    self.status = 'wait_menu';
                    break;
                }
                case 'wait_menu': {
                    let change_to_recent_mode_button = self.get_change_to_recent_mode_button();
                    
                    if ( ! change_to_recent_mode_button ) {
                        break;
                    }
                    
                    change_to_recent_mode_button.click();
                    
                    switch ( document.documentElement.lang ) {
                        case 'ja' :
                            log( '最新ツイート表示へと切り替え中・・・' );
                            break;
                        
                        default :
                            log( 'Switching to latest tweets view...' );
                            break;
                    }
                    
                    self.status = 'wait_home_mode_button_off';
                    break;
                }
                
                case 'wait_home_mode_button_off' : {
                    let home_mode_button = self.get_home_mode_button();
                    
                    if ( home_mode_button ) {
                        break;
                    }
                    
                    switch ( document.documentElement.lang ) {
                        case 'ja' :
                            log( '最新ツイート表示に切り替わりました！' );
                            break;
                        
                        default :
                            log( 'The switch to latest tweets view has been completed !' );
                            break;
                    }
                    self.status = 'idle';
                    break;
                }
            }
        }
        
        get_home_mode_button() {
            let self = this;
            
            return document.querySelector( 'div[role="button"][aria-label="' + self.keystring_map.top_tweets_on + '"]' );
        }
        
        get_change_to_recent_mode_button() {
            let self = this;
            
            return Array.from( document.querySelectorAll( 'div[role="menu"] div[role="menuitem"] > div > div > span' ) )
                .filter( span => ( span.textContent.trim() == self.keystring_map.see_latest_tweets_instead.trim() ) )[ 0 ];
        }
    }( KEYSTRING_MAP ),
    
    observer = new MutationObserver( ( records ) => {
        if ( new URL( location.href ).pathname != '/home' ) {
            return;
        }
        FixToLatestTweetTimeline.update_status();
    } );

observer.observe( document.body, { childList: true, subtree: true } );

} )();
