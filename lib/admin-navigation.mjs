export const navigationGroups=[
 {label:'Overview',items:[['/admin','Statistics']]},
 {label:'Content',items:[['/admin/images','Images'],['/admin/users','Users'],['/admin/ratings','Ratings']]},
 {label:'Caption setup',items:[['/admin/config/chains','Prompt chains'],['/admin/config/steps','Chain steps'],['/admin/config/mix','Caption mix'],['/admin/config/terms','Terms'],['/admin/config/examples','Caption examples'],['/admin/config/models','LLM models'],['/admin/config/providers','LLM providers']]},
 {label:'Generation history',items:[['/admin/observability/requests','Requests'],['/admin/observability/responses','LLM responses'],['/admin/observability/runs','Saved prompt runs']]},
 {label:'Access',items:[['/admin/config/domains','Signup domains'],['/admin/config/emails','Email whitelist'],['/admin/superusers','Administrators']]},
];
export const resourceNames={terms:'term',examples:'caption example',models:'model',providers:'provider',domains:'signup domain',emails:'email address',mix:'caption mix',chains:'prompt chain',steps:'chain step'};
export function isActiveRoute(path,href){return href==='/admin'?path===href:path===href||path.startsWith(href+'/')||(href==='/admin/images'&&path.startsWith('/admin/media'));}
