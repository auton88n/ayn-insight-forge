-- Performance optimization: wrap auth.uid() in (select auth.uid()) so it evaluates once per query, not once per row.

-- access_grants
ALTER POLICY "Admins can manage all access grants" ON public.access_grants USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view all access grants" ON public.access_grants USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can view own access grants" ON public.access_grants USING (user_id = (select auth.uid()));

-- admin_ai_conversations
ALTER POLICY "Admins can insert conversations" ON public.admin_ai_conversations WITH CHECK (((select auth.uid()) = admin_id) AND has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view own conversations" ON public.admin_ai_conversations USING (((select auth.uid()) = admin_id) AND has_role((select auth.uid()), 'admin'::app_role));

-- admin_notification_config
ALTER POLICY "Only admins can manage notification config" ON public.admin_notification_config USING (has_role((select auth.uid()), 'admin'::app_role));

-- admin_notification_log
ALTER POLICY "Only admins can view notification logs" ON public.admin_notification_log USING (has_role((select auth.uid()), 'admin'::app_role));

-- agent_event_debounce
ALTER POLICY "Admin only debounce" ON public.agent_event_debounce USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- agent_telegram_bots
ALTER POLICY "Admins can delete agent_telegram_bots" ON public.agent_telegram_bots USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can insert agent_telegram_bots" ON public.agent_telegram_bots WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can select agent_telegram_bots" ON public.agent_telegram_bots USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update agent_telegram_bots" ON public.agent_telegram_bots USING (has_role((select auth.uid()), 'admin'::app_role));

-- ai_mode_configs
ALTER POLICY "Only admins can manage AI mode configs" ON public.ai_mode_configs USING (has_role((select auth.uid()), 'admin'::app_role));

-- alert_history
ALTER POLICY "Admins can delete alert history" ON public.alert_history USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can select alert history" ON public.alert_history USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update alert history" ON public.alert_history USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- api_rate_limits
ALTER POLICY "Admins can view all rate limits" ON public.api_rate_limits USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can view own rate limits" ON public.api_rate_limits USING ((select auth.uid()) = user_id);

-- application_replies
ALTER POLICY "Duty and admins can delete application replies" ON public.application_replies USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can insert application replies" ON public.application_replies WITH CHECK (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can update application replies" ON public.application_replies USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can view all application replies" ON public.application_replies USING (has_duty_access((select auth.uid())));

-- ayn_activity_log
ALTER POLICY "Admins can view activity log" ON public.ayn_activity_log USING (has_role((select auth.uid()), 'admin'::app_role));

-- ayn_mind
ALTER POLICY "Admin read access" ON public.ayn_mind USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- ayn_sales_pipeline
ALTER POLICY "Admin read access" ON public.ayn_sales_pipeline USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- beta_feedback
ALTER POLICY "Admins can view all feedback" ON public.beta_feedback USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));
ALTER POLICY "Users can submit own feedback" ON public.beta_feedback WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own feedback" ON public.beta_feedback USING ((select auth.uid()) = user_id);

-- calculation_history
ALTER POLICY "Admins can view all calculations" ON public.calculation_history USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create own calculations" ON public.calculation_history WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own calculations" ON public.calculation_history USING ((select auth.uid()) = user_id);

-- chart_analyses
ALTER POLICY "Authenticated users can insert own analyses" ON public.chart_analyses WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own analyses" ON public.chart_analyses USING ((select auth.uid()) = user_id);

-- chat_sessions
ALTER POLICY "Users can manage own chat sessions" ON public.chat_sessions USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- company_journal
ALTER POLICY "Admins can manage company_journal" ON public.company_journal USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view company_journal" ON public.company_journal USING (has_role((select auth.uid()), 'admin'::app_role));

-- company_objectives
ALTER POLICY "Admins can manage company_objectives" ON public.company_objectives USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view company_objectives" ON public.company_objectives USING (has_role((select auth.uid()), 'admin'::app_role));

-- company_state
ALTER POLICY "Admins can manage company_state" ON public.company_state USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view company_state" ON public.company_state USING (has_role((select auth.uid()), 'admin'::app_role));

-- competitor_tweets
ALTER POLICY "Admin read access" ON public.competitor_tweets USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- compliance_inputs
ALTER POLICY "Admins can view all compliance inputs" ON public.compliance_inputs USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create compliance inputs" ON public.compliance_inputs WITH CHECK (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_inputs.project_id AND compliance_projects.user_id = (select auth.uid())));
ALTER POLICY "Users can delete own compliance inputs" ON public.compliance_inputs USING (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_inputs.project_id AND compliance_projects.user_id = (select auth.uid())));
ALTER POLICY "Users can update own compliance inputs" ON public.compliance_inputs USING (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_inputs.project_id AND compliance_projects.user_id = (select auth.uid())));
ALTER POLICY "Users can view own compliance inputs" ON public.compliance_inputs USING (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_inputs.project_id AND compliance_projects.user_id = (select auth.uid())));

-- compliance_projects
ALTER POLICY "Admins can view all compliance projects" ON public.compliance_projects USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create own compliance projects" ON public.compliance_projects WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete own compliance projects" ON public.compliance_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own compliance projects" ON public.compliance_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own compliance projects" ON public.compliance_projects USING ((select auth.uid()) = user_id);

-- compliance_results
ALTER POLICY "Admins can view all compliance results" ON public.compliance_results USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create compliance results" ON public.compliance_results WITH CHECK (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_results.project_id AND compliance_projects.user_id = (select auth.uid())));
ALTER POLICY "Users can delete own compliance results" ON public.compliance_results USING (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_results.project_id AND compliance_projects.user_id = (select auth.uid())));
ALTER POLICY "Users can update own compliance results" ON public.compliance_results USING (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_results.project_id AND compliance_projects.user_id = (select auth.uid())));
ALTER POLICY "Users can view own compliance results" ON public.compliance_results USING (EXISTS (SELECT 1 FROM compliance_projects WHERE compliance_projects.id = compliance_results.project_id AND compliance_projects.user_id = (select auth.uid())));

-- contact_messages
ALTER POLICY "Admins can delete contact messages" ON public.contact_messages USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Only admins can view contact messages" ON public.contact_messages USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "contact_messages_admin_update" ON public.contact_messages USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- creator_profiles
ALTER POLICY "Admins can manage all creator profiles" ON public.creator_profiles USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can delete own creator profile" ON public.creator_profiles USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert own creator profile" ON public.creator_profiles WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own creator profile" ON public.creator_profiles USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- credit_gifts
ALTER POLICY "Admins can manage credit gifts" ON public.credit_gifts USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- device_fingerprints
ALTER POLICY "Admins can manage all device fingerprints" ON public.device_fingerprints USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view all fingerprints" ON public.device_fingerprints USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can delete their own device fingerprints" ON public.device_fingerprints USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert own fingerprints" ON public.device_fingerprints WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert their own device fingerprints" ON public.device_fingerprints WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own fingerprints" ON public.device_fingerprints USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own device fingerprints" ON public.device_fingerprints USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own fingerprints" ON public.device_fingerprints USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own device fingerprints" ON public.device_fingerprints USING ((select auth.uid()) = user_id);

-- drawing_projects
ALTER POLICY "Users can create their own drawing projects" ON public.drawing_projects WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own drawing projects" ON public.drawing_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own drawing projects" ON public.drawing_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own drawing projects" ON public.drawing_projects USING ((select auth.uid()) = user_id);

-- email_logs
ALTER POLICY "Users can view own email logs" ON public.email_logs USING ((select auth.uid()) = user_id);

-- emergency_alerts
ALTER POLICY "Only admins can manage emergency alerts" ON public.emergency_alerts USING (has_role((select auth.uid()), 'admin'::app_role));

-- employee tables
ALTER POLICY "Admins can view employee_discussions" ON public.employee_discussions USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view employee_reflections" ON public.employee_reflections USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view employee_states" ON public.employee_states USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view employee_tasks" ON public.employee_tasks USING (has_role((select auth.uid()), 'admin'::app_role));

-- engineering_activity
ALTER POLICY "Admins can view all engineering activities" ON public.engineering_activity USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Block anonymous engineering_activity access" ON public.engineering_activity USING ((select auth.uid()) IS NOT NULL) WITH CHECK ((select auth.uid()) IS NOT NULL);
ALTER POLICY "Users can delete own engineering activities" ON public.engineering_activity USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can insert own engineering activities" ON public.engineering_activity WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own engineering activities" ON public.engineering_activity USING ((select auth.uid()) = user_id);

-- engineering_portfolio
ALTER POLICY "Admins can manage all portfolio items" ON public.engineering_portfolio USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create their own portfolio items" ON public.engineering_portfolio WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own portfolio items" ON public.engineering_portfolio USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own portfolio items" ON public.engineering_portfolio USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own portfolio items" ON public.engineering_portfolio USING ((select auth.uid()) = user_id);

-- engineering_projects
ALTER POLICY "Admins can manage all projects" ON public.engineering_projects USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create own projects" ON public.engineering_projects WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete own projects" ON public.engineering_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own projects" ON public.engineering_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own projects" ON public.engineering_projects USING ((select auth.uid()) = user_id);

-- error_logs
ALTER POLICY "Admins can read all errors" ON public.error_logs USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can insert own errors" ON public.error_logs WITH CHECK ((user_id = (select auth.uid())) OR (user_id IS NULL));

-- faq_items
ALTER POLICY "Duty and admins can manage FAQs" ON public.faq_items USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can view all FAQs" ON public.faq_items USING (has_duty_access((select auth.uid())));

-- favorite_chats
ALTER POLICY "Users can create their own favorite chats" ON public.favorite_chats WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own favorite chats" ON public.favorite_chats USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own favorite chats" ON public.favorite_chats USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own favorite chats" ON public.favorite_chats USING ((select auth.uid()) = user_id);

-- founder_context
ALTER POLICY "founder_context_service_only" ON public.founder_context USING ((auth.role() = 'service_role'::text) OR (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role)));

-- founder_directives
ALTER POLICY "Admins can manage directives" ON public.founder_directives USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- grading_projects
ALTER POLICY "Users can create their own grading projects" ON public.grading_projects WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own grading projects" ON public.grading_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own grading projects" ON public.grading_projects USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own grading projects" ON public.grading_projects USING ((select auth.uid()) = user_id);

-- inbound_email_replies
ALTER POLICY "Admins can delete inbound replies" ON public.inbound_email_replies USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update inbound replies" ON public.inbound_email_replies USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view inbound replies" ON public.inbound_email_replies USING (has_role((select auth.uid()), 'admin'::app_role));

-- ip_blocks
ALTER POLICY "Only admins can manage IP blocks" ON public.ip_blocks USING (has_role((select auth.uid()), 'admin'::app_role));

-- llm tables
ALTER POLICY "Admins can view failures" ON public.llm_failures USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can manage models" ON public.llm_models USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view all usage" ON public.llm_usage_logs USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can view own usage" ON public.llm_usage_logs USING ((select auth.uid()) = user_id);

-- marketing_competitors
ALTER POLICY "Admin read access" ON public.marketing_competitors USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- material_prices
ALTER POLICY "Admins can manage material prices" ON public.material_prices USING (has_role((select auth.uid()), 'admin'::app_role));

-- message_ratings
ALTER POLICY "Admins can view all feedback" ON public.message_ratings USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can insert their own feedback" ON public.message_ratings WITH CHECK (((select auth.uid()) IS NULL) OR ((select auth.uid()) = user_id));
ALTER POLICY "Users can view own feedback" ON public.message_ratings USING ((select auth.uid()) = user_id);

-- messages
ALTER POLICY "Users can create their own messages" ON public.messages WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own messages" ON public.messages USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own messages" ON public.messages USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own messages" ON public.messages USING ((select auth.uid()) = user_id);

-- pending_pin_changes
ALTER POLICY "Admins can create pending PIN changes" ON public.pending_pin_changes WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view pending PIN changes" ON public.pending_pin_changes USING (has_role((select auth.uid()), 'admin'::app_role));

-- performance_metrics
ALTER POLICY "Only admins can insert performance metrics" ON public.performance_metrics WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Only admins can view performance metrics" ON public.performance_metrics USING (has_role((select auth.uid()), 'admin'::app_role));

-- pinned_sessions
ALTER POLICY "Users can manage own pinned sessions" ON public.pinned_sessions USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- profiles
ALTER POLICY "Admins can delete all profiles" ON public.profiles USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update all profiles" ON public.profiles USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can create own profile" ON public.profiles WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "profiles_admin_select_with_audit" ON public.profiles USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "profiles_admin_update_with_audit" ON public.profiles USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "profiles_insert_own" ON public.profiles WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "profiles_select_own" ON public.profiles USING ((select auth.uid()) = user_id);
ALTER POLICY "profiles_update_own" ON public.profiles USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- rate_limits
ALTER POLICY "Users can insert rate limit records" ON public.rate_limits WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own rate limits" ON public.rate_limits USING ((select auth.uid()) = user_id);

-- saved_insights
ALTER POLICY "Users can manage their own insights" ON public.saved_insights USING ((select auth.uid()) = user_id);

-- saved_responses
ALTER POLICY "Users can create their own saved responses" ON public.saved_responses WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can delete their own saved responses" ON public.saved_responses USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can update their own saved responses" ON public.saved_responses USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view their own saved responses" ON public.saved_responses USING ((select auth.uid()) = user_id);

-- security tables
ALTER POLICY "Only admins can view audit logs" ON public.security_audit_logs USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view security_incidents" ON public.security_incidents USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Only admins can view security logs" ON public.security_logs USING (((select auth.uid()) IS NOT NULL) AND has_role((select auth.uid()), 'admin'::app_role));

-- service_applications
ALTER POLICY "Duty and admins can delete applications" ON public.service_applications USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can update applications" ON public.service_applications USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can view all applications" ON public.service_applications USING (has_duty_access((select auth.uid())));

-- service_economics
ALTER POLICY "Admins can manage service_economics" ON public.service_economics USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view service_economics" ON public.service_economics USING (has_role((select auth.uid()), 'admin'::app_role));

-- stress_test_metrics
ALTER POLICY "Admins can manage stress metrics" ON public.stress_test_metrics USING (has_role((select auth.uid()), 'admin'::app_role));

-- support_ticket_replies
ALTER POLICY "Admins can insert ticket replies" ON public.support_ticket_replies WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));
ALTER POLICY "Admins can manage ticket replies" ON public.support_ticket_replies USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));

-- support_tickets
ALTER POLICY "Anyone can create tickets" ON public.support_tickets WITH CHECK ((((select auth.uid()) IS NOT NULL) AND (user_id = (select auth.uid()))) OR (((select auth.uid()) IS NULL) AND (user_id IS NULL) AND (guest_email IS NOT NULL) AND (length(guest_email) > 5)));
ALTER POLICY "Duty and admins can delete tickets" ON public.support_tickets USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can update all tickets" ON public.support_tickets USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can view all tickets" ON public.support_tickets USING (has_duty_access((select auth.uid())));
ALTER POLICY "Users can update own tickets" ON public.support_tickets USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own tickets" ON public.support_tickets USING ((select auth.uid()) = user_id);

-- system tables
ALTER POLICY "Admins can manage system config" ON public.system_config USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view system_health_checks" ON public.system_health_checks USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admin only system reports" ON public.system_reports WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = (select auth.uid()) AND user_roles.role = 'admin'::app_role));
ALTER POLICY "Admins can view all system reports" ON public.system_reports USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Only admins can manage system status" ON public.system_status USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- terms_consent_log
ALTER POLICY "Admins can read all consent" ON public.terms_consent_log USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can insert own consent" ON public.terms_consent_log WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can read own consent" ON public.terms_consent_log USING ((select auth.uid()) = user_id);

-- test tables
ALTER POLICY "Admins can manage test results" ON public.test_results USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can manage test runs" ON public.test_runs USING (has_role((select auth.uid()), 'admin'::app_role));

-- threat_detection
ALTER POLICY "Only admins can manage threat detection" ON public.threat_detection USING (has_role((select auth.uid()), 'admin'::app_role));

-- ticket_messages
ALTER POLICY "Duty and admins can create ticket messages" ON public.ticket_messages WITH CHECK (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can delete ticket messages" ON public.ticket_messages USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can update ticket messages" ON public.ticket_messages USING (has_duty_access((select auth.uid())));
ALTER POLICY "Duty and admins can view all ticket messages" ON public.ticket_messages USING (has_duty_access((select auth.uid())));
ALTER POLICY "Users can create messages on own tickets" ON public.ticket_messages WITH CHECK ((EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_messages.ticket_id AND support_tickets.user_id = (select auth.uid()))) AND (sender_type = 'user'::ticket_sender_type) AND (is_internal_note = false));
ALTER POLICY "Users can view own ticket messages" ON public.ticket_messages USING ((EXISTS (SELECT 1 FROM support_tickets WHERE support_tickets.id = ticket_messages.ticket_id AND support_tickets.user_id = (select auth.uid()))) AND (is_internal_note = false));

-- twitter_posts
ALTER POLICY "Admin full access to twitter_posts" ON public.twitter_posts USING (EXISTS (SELECT 1 FROM access_grants ag WHERE ag.user_id = (select auth.uid()) AND ag.is_active = true));

-- usage_logs
ALTER POLICY "Admins can view all usage logs" ON public.usage_logs USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can insert own usage logs" ON public.usage_logs WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own usage logs" ON public.usage_logs USING ((select auth.uid()) = user_id);

-- user_ai_limits
ALTER POLICY "Admins can insert user_ai_limits" ON public.user_ai_limits WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can manage all limits" ON public.user_ai_limits USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can select all user_ai_limits" ON public.user_ai_limits USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update all user_ai_limits" ON public.user_ai_limits USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can view own limits" ON public.user_ai_limits USING ((select auth.uid()) = user_id);

-- user_memory
ALTER POLICY "Admins can view all memory" ON public.user_memory USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can manage own memory" ON public.user_memory USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own memory" ON public.user_memory USING ((select auth.uid()) = user_id);

-- user_preferences
ALTER POLICY "Admins can view all preferences" ON public.user_preferences USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can insert own preferences" ON public.user_preferences WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own preferences" ON public.user_preferences USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own preferences" ON public.user_preferences USING ((select auth.uid()) = user_id);

-- user_roles
ALTER POLICY "Admins can manage all roles" ON public.user_roles USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can view own roles" ON public.user_roles USING (user_id = (select auth.uid()));

-- user_settings
ALTER POLICY "Users can insert own settings" ON public.user_settings WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can update own settings" ON public.user_settings USING ((select auth.uid()) = user_id);
ALTER POLICY "Users can view own settings" ON public.user_settings USING ((select auth.uid()) = user_id);

-- user_subscriptions
ALTER POLICY "Admins can insert user subscriptions" ON public.user_subscriptions WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can select all user subscriptions" ON public.user_subscriptions USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update all user subscriptions" ON public.user_subscriptions USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users can view own subscription" ON public.user_subscriptions USING ((select auth.uid()) = user_id);

-- visitor_analytics
ALTER POLICY "Admins can view all analytics" ON public.visitor_analytics USING (has_role((select auth.uid()), 'admin'::app_role));