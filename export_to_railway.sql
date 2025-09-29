--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    movie_id integer,
    image_url text,
    priority integer DEFAULT 1 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    type text,
    category text,
    price text
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- Name: collections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    movie_ids jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.collections OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(255) NOT NULL,
    content_id character varying(255) NOT NULL,
    comment text NOT NULL,
    rating integer,
    approved boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contact_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contact_messages OWNER TO postgres;

--
-- Name: content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.content (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tmdb_id integer NOT NULL,
    title text NOT NULL,
    description text,
    poster_path text,
    backdrop_path text,
    release_date text,
    genres jsonb,
    odysee_url text,
    language text NOT NULL,
    quality text NOT NULL,
    media_type text NOT NULL,
    rating integer,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    mux_playback_id text,
    mux_url text
);


ALTER TABLE public.content OWNER TO postgres;

--
-- Name: episodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.episodes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    content_id character varying NOT NULL,
    season_number integer NOT NULL,
    episode_number integer NOT NULL,
    title text NOT NULL,
    description text,
    odysee_url text,
    mux_playback_id text,
    mux_url text,
    duration integer,
    release_date text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.episodes OWNER TO postgres;

--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.favorites (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    movie_id integer NOT NULL,
    movie_title text NOT NULL,
    movie_poster text,
    movie_genres jsonb,
    added_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    subscription_id character varying,
    amount integer NOT NULL,
    method text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    transaction_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    payment_data jsonb
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    plan_id text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    amount integer NOT NULL,
    payment_method text NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    preferred_genres jsonb,
    language text DEFAULT 'fr'::text NOT NULL,
    autoplay boolean DEFAULT true NOT NULL
);


ALTER TABLE public.user_preferences OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    session_start timestamp without time zone DEFAULT now() NOT NULL,
    session_end timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    banned boolean DEFAULT false NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: view_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.view_tracking (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    movie_id integer NOT NULL,
    view_duration integer,
    view_date timestamp without time zone DEFAULT now() NOT NULL,
    session_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.view_tracking OWNER TO postgres;

--
-- Name: watch_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.watch_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    movie_id integer NOT NULL,
    movie_title text NOT NULL,
    movie_poster text,
    watched_at timestamp without time zone DEFAULT now() NOT NULL,
    watch_duration integer DEFAULT 0
);


ALTER TABLE public.watch_history OWNER TO postgres;

--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (id, title, description, movie_id, image_url, priority, active, created_at, type, category, price) FROM stdin;
f0e5d77f-4a8a-4baf-a5bd-474e0677970b	Débloquez le streaming premium	Accédez à des milliers de films et séries en HD&amp;#x2F;4K. Paiement sécurisé avec Orange Money, Wave, et cartes bancaires acceptées.	\N		1	t	2025-09-18 16:53:52.298615	subscription	promotion	2.000
\.


--
-- Data for Name: collections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collections (id, name, description, movie_ids, created_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, user_id, content_id, comment, rating, approved, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.contact_messages (id, name, email, message, created_at) FROM stdin;
\.


--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.content (id, tmdb_id, title, description, poster_path, backdrop_path, release_date, genres, odysee_url, language, quality, media_type, rating, active, created_at, updated_at, mux_playback_id, mux_url) FROM stdin;
187a67c3-f68c-46f7-a390-a3617247d50b	27205	Inception	Un voleur qui s'infiltre dans les rêves est chargé d'implanter une idée dans l'esprit d'une cible.	/8IB2e4r4oVhHnANbnm7O3Tj6tF8.jpg	/s3TBrRGB1iav7gFOCNx3H31MoES.jpg	2010-07-16	["Action", "Science Fiction", "Aventure"]	https://odysee.com/@example:1/inception:1	vf	hd	movie	8	t	2025-09-18 02:40:35.246316	2025-09-18 02:40:35.246316	\N	\N
26c44ff3-ac5f-4a70-8140-6ec312de0166	1078605	Évanouis	En plein cœur de la nuit, les 17 enfants d&amp;#x27;une classe de l&amp;#x27;école primaire de Maybrook aux États-Unis se réveillent à une heure précise et s&amp;#x27;enfuient de leurs foyers. Mus par une force inébranlable, ils sont partis à la course et personne ne sait où ils s&amp;#x27;en sont allés. Tous ont disparu, sauf un. Alex est le seul élève restant. Paniqués et inquiets, les parents soupçonnent l&amp;#x27;enseignante Justine Gandy d&amp;#x27;avoir manigancé quelque chose.	&amp;#x2F;3eRJV97oZDY6LORwPNdWlfdPLnd.jpg	&amp;#x2F;wJ20rOZ1VgkCqv1jeOQB2Brny9k.jpg	2025-08-04	["Horreur", "Mystère"]	https://youtu.be/FR8KuG3g2rg?si=Cz1w-JJBA4t7frR9	fr	hd	movie	74	t	2025-09-18 18:53:35.314362	2025-09-19 00:03:07.876	\N	\N
69d3d574-edad-4048-b1e5-ec02e91c3616	755898	La Guerre des mondes	Une invasion gargantuesque approche dans cette nouvelle interprétation du légendaire roman homonyme devenu un classique de la science-fiction. La célèbre Eva Longoria partage l'affiche avec le rappeur/acteur Ice Cube, Michael O'Neill et Iman Benson, dans une aventure extraordinaire abordant des thématiques actuelles telles que la technologie, la surveillance et la protection de la vie privée.	/yvirUYrva23IudARHn3mMGVxWqM.jpg	/iZLqwEwUViJdSkGVjePGhxYzbDb.jpg	2025-07-29	[878, 53]		vf	hd	movie	43	t	2025-09-20 04:23:38.096787	2025-09-20 04:23:38.096787		
a860ee18-538e-4474-bde2-50e129be6b56	1038392	Conjuring : L'Heure du jugement	Patrick Wilson et Vera Farmiga feront leur dernière apparition dans les rôles d’Ed et Lorraine Warren dans Conjuring : l’heure du jugement, inspiré de l’histoire vraie de la famille Smurl, hantée par un démon. Les Warrens affrontent le cas le plus terrifiant de leur carrière lorsqu’une demeure de la Pennsylvanie devient hantée par des forces surnaturelles impitoyables.	/mlkMH0Em29I0QBc7YeRc9yGFRKw.jpg	/fq8gLtrz1ByW3KQ2IM3RMZEIjsQ.jpg	2025-09-03	[27]		vf	hd	movie	66	t	2025-09-20 04:23:38.270322	2025-09-20 04:23:38.270322		
2fcee4a1-7103-40ec-8e6d-d1b75f553f35	1061474	Superman	Superman doit trouver l’équilibre entre ses racines kryptoniennes et son identité humaine, sous les traits de Clark Kent, originaire de Smallville, dans le Kansas. Il est l’incarnation de la vérité, de la justice et des valeurs américaines et il est animé par une véritable bienveillance dans un monde qui considère cette qualité comme obsolète.	&amp;amp;#x2F;bL1U8TDb2ZiThIBFAdKHOfpv8lk.jpg	&amp;amp;#x2F;eU7IfdWq8KQy0oNd4kKXS0QUR08.jpg	2025-07-09	[]	https://ody.sh/xGumIC3H38	vf	hd	movie	\N	f	2025-09-18 14:13:59.172937	2025-09-20 00:10:16.206	\N	\N
3ead616c-f79d-499d-8742-8f20bce0efd0	1007734	Nobody 2	Quatre ans après sa malencontreuse altercation avec la mafia russe, Hutch doit toujours 30 millions de dollars à la redoutable organisation et s'efforce de la rembourser en enchaînant sans répit les contrats d'une liste de criminels à abattre aussi interminable qu'internationale. Bien qu'il apprécie le caractère intense de son travail, Hutch se retrouve vite surmené, tout comme sa femme Becca, et ils s'éloignent inexorablement l'un de l'autre.	/gmyEMJqpScyALufAMspejI6qGQx.jpg	/mEW9XMgYDO6U0MJcIRqRuSwjzN5.jpg	2025-08-13	[28, 53]		vf	hd	movie	73	t	2025-09-20 04:23:38.360162	2025-09-20 04:23:38.360162		
eda8c843-1a5d-429c-8bff-3132a72e3599	299534	Avengers : Endgame	Après les événements dévastateurs d&amp;#x27;Avengers: Infinity War, l&amp;#x27;univers est en ruine. Avec l&amp;#x27;aide des alliés restants, les Avengers s&amp;#x27;associent pour inverser les actions de Thanos et rétablir l&amp;#x27;équilibre dans l&amp;#x27;univers.	&amp;#x2F;or06FN3Dka5tukK1e9sl16pB3iy.jpg	&amp;#x2F;7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg	2019-04-26	["Action", "Aventure", "Science Fiction"]	https://zupload.cc/embed/fgZsz3MDvik62DA	vf	4k	movie	8	t	2025-09-18 02:40:35.278336	2025-09-20 12:58:36.022	\N	\N
2aaa2849-f8d3-4abb-9d87-772fffcdcebb	506763	Détective Dee : La Légende des rois célestes	Une vague de crime perpétrée par de mystérieux guerriers masqués terrifie l’Empire de la dynastie des Tang. Alors que le Detective Dee se retrouve en charge de l’enquête, ses découvertes prennent vite une tournure surnaturelle. Les sculptures du palais impérial prennent vie et les quatre rois célestes sont plus menaçant que jamais… Il se pourrait bien que le Detective Dee soit confronté à son plus grand défi, alors même qu’il doit faire face aux accusations de sa pire ennemie, l’impératrice Wu.	/jAO1SGdeiRsL44R73Fjp0BOmAtG.jpg	/rzGHVq2BCMwjp93QaKYoLPSaSrp.jpg	2018-07-27	[28, 14, 12, 9648]		vf	hd	movie	62	t	2025-09-20 04:23:38.452275	2025-09-20 04:23:38.452275		
cac09b8d-8d40-4244-b720-93cc16295ff4	1035259	Y a-t-il un flic pour sauver le monde ?	Frank Drebin est le fils du légendaire inspecteur gaffeur du même nom. Son enquête sur un accident d’auto mortel l’amène à rencontrer la séduisante Beth Davenport, sœur de l’infortunée victime. Leur investigation les conduit à Richard Cane, le richissime et génial inventeur d’une automobile électrique révolutionnaire. Au fil de son enquête, Frank découvre que Cane fomente un sombre complot : utiliser une fréquence sonore inaudible pour renvoyer l'humanité à l'état sauvage.	/dVchp83dtJokn4vYUFzOV5XjyXa.jpg	/kzeBfhXMRWiykBsqoL3UbfaM0S.jpg	2025-07-30	[35, 28, 80]		vf	hd	movie	67	t	2025-09-20 04:23:38.531767	2025-09-20 04:23:38.531767		
2e7c8b8d-4512-4243-b107-0305bc6a5a97	1028248	Au seuil de la mort	Dans une petite ville proche de la frontière mexicaine, Bryant se lie d'amitié avec un adolescent perturbé et l'initie aux arts martiaux. Alors que le passé mystérieux de Bryant le rattrape de façon explosive, il est contraint à un combat de vie ou de mort dans le but de laver son nom, sauver le garçon et récupérer tout ce qu'il a été contraint de laisser derrière lui.	/sK0Rq2jaegh2NnEV0NzMdvXgO6w.jpg	/or8y8JFF0vR3N9ap0Vdhf9tfTxQ.jpg	2022-12-16	[28, 80]		vf	hd	movie	64	t	2025-09-20 04:23:38.602428	2025-09-20 04:23:38.602428		
82a20ae2-15a4-4b9c-99bb-31891c3d6fbd	603	The Matrix	Un hacker reclus est contacté par de mystérieux rebelles qui l'emmènent dans une prairie d'auto-routes du futur.	/f89U3ADr1oiB1s9Gkd1B0mjWUSx.jpg	/hQq8xZe5uLjFzSBt4LanNP7SQjl.jpg	1999-03-31	["Action", "Science Fiction"]	https://odysee.com/@example:1/the-matrix:1	vostfr	hd	movie	8	t	2025-09-18 02:40:35.284764	2025-09-18 19:37:28.916	\N	\N
8571b3a3-5f83-4b78-bb9a-2d2ce5e9e0f3	1311031	Demon Slayer: Kimetsu no Yaiba - La Forteresse infinie		&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;#x2F;wXTU3AFmlUPbqjH68MZ989uHd6k.jpg	&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;#x2F;1RgPyOhN4DRs225BGTlHJqCudII.jpg	2025-07-18	["Animation", "Action", "Fantastique", "Thriller"]	https://zupload.cc/embed/kXHdlQd2HPGFyGT	fr	hd	movie	77	t	2025-09-18 18:53:35.326988	2025-09-20 03:02:18.923	nxJGpRqIjgXGrfiYf3X01jWUVTpn02yKNfZtFsApwHLXs	\N
24d01846-0b6c-4815-9ce8-5255fe1a587b	1369679	Get Fast	Quand son complice disparaît après un braquage spectaculaire, un voleur notoire se lance à sa recherche sur le territoire d'un baron de la drogue impitoyable. Traqué par des flics corrompus, des sbires et un tueur sociopathe surnommé The Cowboy, il découvre jusqu'où va la loyauté quand les balles sifflent.	/2MZBpW0bfQNJdWPCDM7OZetem1L.jpg	/JMlVj6X2F1PuDz9OyHShThzpa2.jpg	2024-12-12	[28, 80, 53]		vf	hd	movie	62	t	2025-09-20 04:23:38.686742	2025-09-20 04:23:38.686742		
72a6dbf4-e1ca-40f1-8bea-66cbc4e2d48b	911430	F1® Le Film	Sonny Hayes était le prodige de la F1 des années 90 jusqu’à son terrible accident. Trente ans plus tard, devenu un pilote indépendant, il est contacté par Ruben Cervantes, patron d’une écurie en faillite qui le convainc de revenir pour sauver l’équipe et prouver qu’il est toujours le meilleur. Aux côtés de Joshua Pearce, diamant brut prêt à devenir le numéro 1, Sonny réalise vite qu'en F1, son coéquipier est aussi son plus grand rival, que le danger est partout et qu'il risque de tout perdre.	/9i5VlOVWAQ8yTyCLNNVXa7hozUu.jpg	/ZtcGMc204JsNqfjS9lU6udRgpo.jpg	2025-06-25	[28, 18]		vf	hd	movie	78	t	2025-09-20 04:23:38.776282	2025-09-20 04:23:38.776282		
1625f714-72c3-4aab-a53f-b4a3e9846ffe	914215	Humanité	Suite à un effondrement écologique forçant l'humanité à sacrifier la vie de 20 % de sa population, un dîner familial vire au cauchemar lorsque le père fait part de sa décision de participer au nouveau programme d'euthanasie gouvernemental.	/mY5gLNJfUyKEQOuBAiH0ErEZPXi.jpg	/mwI1OarF7BVWwn5O1Ng73UhyctP.jpg	2024-04-26	[27, 878, 53]		vf	hd	movie	54	t	2025-09-20 04:23:38.839963	2025-09-20 04:23:38.839963		
72ac1f26-94da-492e-b4cc-c2c387bc6e38	1234821	Jurassic World : Renaissance	Une nouvelle ère voit le jour. Une équipe visite le lieu le plus risqué sur terre, une île sur laquelle vivent des dinosaures trop dangereux pour le Parc Jurassique original. Leur mission : recueillir l'ADN de trois dinosaures gigantesques pour créer un médicament aux bienfaits miraculeux. Dans cette contrée truffée de périls, ils découvrent un secret dissimulé au monde entier depuis des décennies.	/uNHxkEWfcKFFZO6QDMXyFi8JF08.jpg	/zNriRTr0kWwyaXPzdg1EIxf0BWk.jpg	2025-07-01	[878, 12, 28]		vf	hd	movie	64	t	2025-09-20 04:23:38.91941	2025-09-20 04:23:38.91941		
46f5190b-b816-417f-a276-851877d6549a	1051486	Stockholm Bloodbath	En 1520, le roi danois Christian II, avide de pouvoir, est déterminé à s'emparer de la couronne suédoise de Sten Sture. Pendant ce temps, les sœurs Freja et Anne font la promesse solennelle de se venger des hommes qui ont brutalement assassiné leur famille.	/o4euFuqeruXIHcNvi5RorafnGs3.jpg	/6nCy4OrV7gxhDc3lBSUxkNALPej.jpg	2024-01-19	[28, 36, 18, 12, 10752]		vf	hd	movie	62	t	2025-09-20 04:23:39.017102	2025-09-20 04:23:39.017102		
e3e78653-e51c-4351-8a6c-513c6c47f423	575265	Mission : Impossible - The Final Reckoning	Ethan Hunt se rend à Londres avec son équipe dans l'espoir de remonter la piste du mystérieux Gabriel, qu'il a affronté deux mois auparavant à bord de l'Orient-Express et qui détient la clé contrôlant l’intelligence artificielle toute puissante surnommée l'Entité. Adulée par les uns, redoutée par les autres, l’Entité se distingue par sa capacité à prédire toutes les éventualités possibles. Elle connaît parfaitement les forces et faiblesses d’Ethan et de son équipe. Gabriel compte l'utiliser pour mettre en œuvre son plan ultime : annihiler Ethan et son équipe, s’emparer de tous les systèmes de défense planétaires et déclencher la Troisième Guerre mondiale.	/AozMgdALZuR1hDPZt2a1aXiWmL4.jpg	/538U9snNc2fpnOmYXAPUh3zn31H.jpg	2025-05-17	[28, 12, 53]		vf	hd	movie	73	t	2025-09-20 04:23:39.146527	2025-09-20 04:23:39.146527		
efbb8568-61fb-414e-acab-86cbad6856ef	691363	La Chose Derrière La Porte	France, 1917, Adèle, une jeune paysanne vivant seule dans une ferme isolée, est littéralement hantée par la mort de son mari, tué au front au début de la Première Guerre Mondiale.  Désespérée et incapable de surmonter la douleur provoquée par cette perte tragique, la jeune femme a finalement recours à la magie noire, dans l’espoir de faire « revenir » son bien-aimé.  Le miracle aura bien lieu, mais Adèle va payer très cher l’ouverture de cette véritable boîte de Pandore…	/yMBMPRyrgSxuWeswuplS5rTqfsw.jpg	/7FTOVQO3pndOuswVS3iNt3odVq5.jpg	2023-01-16	[27]		vf	hd	movie	55	t	2025-09-20 04:23:39.235922	2025-09-20 04:23:39.235922		
27d3c111-bd94-439f-b7ab-d15e3ee98101	803796	KPop Demon Hunters	Quand elles ne remplissent pas les stades, Rumi, Mira et Zoey, superstars de la K-pop, utilisent leurs pouvoirs secrets pour protéger leurs fans de menaces surnaturelles.	/6IhKiHwbfUnPqYPuibn5QpKmgHz.jpg	/w3Bi0wygeFQctn6AqFTwhGNXRwL.jpg	2025-06-20	[16, 35, 14, 10402]		vf	hd	movie	83	t	2025-09-20 04:23:39.310718	2025-09-20 04:23:39.310718		
17c2205e-4d2f-40f8-8d25-59b84fadcfaa	1087192	Dragons	Sur l'île accidentée de Berk, où Vikings et dragons se vouent une haine viscérale depuis des générations, Harold fait figure d'exception. Fils inventif mais négligé du chef Stoïck la Brute, il bouscule les traditions en se liant d'amitié avec Krokmou, une Furie nocturne. Leur duo improbable va révéler la vraie nature des dragons et bouleverser les fondements de la société viking. Avec la forte et ambitieuse Astrid et l'excentrique forgeron du village Gueulfor à ses côtés, Harold fait face à un monde déchiré par la peur et l'incompréhension. Lorsqu'une ancienne menace refait surface et met en péril les Vikings autant que les dragons, l'amitié entre Harold et Krokmou devient la clé de l'élaboration d'un avenir meilleur. Ensemble, ils doivent trouver la voie menant à la paix, s'envolant au-delà des frontières de leurs mondes pour redéfinir la véritable nature d'un héros et d'un chef.	/515phfKCjq7zBEY2UoslEAoNgnW.jpg	/vHTFrcqJoCi1is3XN0PZe2LSnI2.jpg	2025-06-06	[14, 10751, 28, 12]		vf	hd	movie	80	t	2025-09-20 04:23:39.385768	2025-09-20 04:23:39.385768		
25eb1b27-e206-4ef2-9eb3-d5712eeebf72	1242011	Together	Établis depuis peu à la campagne, Tim et Millie font une première randonnée dans la forêt voisine. Le temps virant à l'orage, le musicien glisse dans une crevasse, en entraînant sa petite amie institutrice avec lui. Préférant attendre la fin de l'averse avant de remonter à la surface, le couple passe la nuit dans cette caverne où ils épanchent leur soif à même une source. Mais les jours suivants, Tim, puis Millie, sont l'objet de mutations physiques aussi terrifiantes qu'inexplicables, qui mettent à l'épreuve leur relation déjà chancelante.	/ijTTISrLopthgligJOPOx4jEyoH.jpg	/uBB1aMga5ngZxsUQL5k36zeW3pB.jpg	2025-07-28	[27]		vf	hd	movie	71	t	2025-09-20 04:23:39.454126	2025-09-20 04:23:39.454126		
bbfcb97e-2790-478c-91d5-c730817975ce	1119878	Ice Road : La vengeance	Mike McCann, chauffeur spécialisé dans la conduite sur verglas, honore la dernière volonté de son frère et va au Népal pour disperser ses cendres sur l'Everest. À bord d'un bus touristique bondé traversant la tristement célèbre route du ciel, Mike et son guide rencontrent des mercenaires et doivent se battre pour sauver leur peau, celle d'un bus de voyageurs et le village local.	/oj3PT72HOXd3CJ6Y45PMYsIaf3O.jpg	/2nwhxEyefcIFKwOrSigiamoIzu2.jpg	2025-06-27	[28, 53, 18]		vf	hd	movie	65	t	2025-09-20 04:23:39.546134	2025-09-20 04:23:39.546134		
d88d4e8d-15e4-435c-a49c-3f080a2b6763	7451	xXx	Après une série de tests, Xander Cage dit « xXx », un spécialiste des sports extrêmes couvert de tatouages, est recruté par Augustus Gibbons, un agent de la National Security Agency (NSA), pour s’infiltrer dans une organisation criminelle et mettre fin à ses agissements. Dirigée par un certain Yorgi, celle‐ci se fait appeler « Anarchie 99 » et son siège se situe à Prague, en République tchèque. Gibbons est persuadé que Xander Cage réussira là où les espions conventionnels ont échoué.Ce dernier insiste toutefois pour accomplir cette mission à sa façon. Il se présente alors directement à Yorgi et se lie rapidement d’amitié avec lui, l’occasion pour Xander Cage de découvrir les terribles desseins de l’organisation.	/o7GKHohhZ124UkTxP7mHyDnPpK6.jpg	/a6bItEVaxgphpMswho1wVRerv4r.jpg	2002-08-09	[28, 12, 53, 80]		vf	hd	movie	60	t	2025-09-20 04:23:41.143839	2025-09-20 04:23:41.143839		
9cd949cb-069d-41c6-b106-099c9c3c6394	1175942	Les Bad Guys 2	Un loup, un serpent, une tarentule, un requin et un piranha sont une ancienne bande de criminels repentis tentant une réinsertion dans la société. Cependant, leur mauvaise réputation les précède et ils peinent à trouver du travail. Lorsqu'une série de cambriolages sont perpétrés dans la ville, ils en deviennent les principaux suspects. Pour prouver leurs bonnes intentions, ils offrent à la commissaire de police d'utiliser leurs habiletés uniques pour identifier le véritable coupable.	/g0bqsqjOiQQmkmypIME3y0Hp6UB.jpg	/jvpkBenB6hv19WWYVlaiow8zklq.jpg	2025-07-24	[16, 10751, 35, 80, 12]		vf	hd	movie	78	t	2025-09-20 04:23:41.230471	2025-09-20 04:23:41.230471		
c1e0aab2-b698-4174-b631-2929eb9e3d76	1321439	Paris perdu	Quand Dawn, une candidate, comprend que son émission de rencontres va avoir lieu à Paris, au Texas, et non en France, elle veut tout plaquer – avant de craquer sur le prétendant.	/sP3ACwwRCybwQqSYWaBMbeWoEwB.jpg	/i8QHgJKnsd8csNBo8fH9wYW2Y9E.jpg	2025-09-11	[10749, 35]		vf	hd	movie	67	t	2025-09-20 04:23:41.302151	2025-09-20 04:23:41.302151		
47d17c9c-aa92-434f-af09-620947cb8882	617126	Les 4 Fantastiques : Premiers pas	Dans le contexte vibrant d’un monde rétro-futuriste inspiré des années 60, le film présente la première famille de Marvel : Reed Richards/Mister Fantastic, Sue Storm/La Femme Invisible, Johnny Storm/La Torche Humaine et Ben Grimm/La Chose  alors qu’ils font face à leur défi le plus redoutable à ce jour. Contraints d’équilibrer leur rôle de héros avec la force de leur lien familial, ils doivent défendre la Terre contre un dieu spatial vorace appelé Galactus et son énigmatique héraut, le Surfeur d’Argent. Et comme si le plan de Galactus de dévorer la planète entière et tous ses habitants n’était pas déjà assez mauvais, cela devient soudainement très personnel.	/rNc4KARs6fVa4axzvuv3NfUiNy1.jpg	/s94NjfKkcSczZ1FembwmQZwsuwY.jpg	2025-07-23	[878, 12]		vf	hd	movie	72	t	2025-09-20 04:23:41.383248	2025-09-20 04:23:41.383248		
92271a0e-e9a8-4b6b-9254-9e0564246bc5	1151334	Wild Speed Girl	L'histoire d'une femme qui, après avoir travaillé comme chauffeuse pour des criminels quand elle était adolescente, se retrouve forcée de replonger dans son passé lorsqu'un ancien employeur lui propose un marché  pour sauver la vie de son ex, aussi instable qu’imprévisible.	/eSN5r6voacmO6yetv2ciBpaFCOe.jpg	/8jeDyvFQKgss36FbGAmGQVzPXlH.jpg	2025-08-21	[53, 28, 35]		vf	hd	movie	64	t	2025-09-20 04:23:41.461673	2025-09-20 04:23:41.461673		
0d650ddc-4763-4fff-88d3-90f2b467c772	13494	Red Sonja	Réduite en esclavage par un tyran maléfique qui souhaite détruire son peuple, Sonia la barbare doit réunir un groupe de guerriers improbables afin d’affronter Draygan et son épouse impitoyable,  Annisia.	/rmoaCJYM2qVYL2LfJmQCkiEwMl.jpg	/xSD0q1FiuZkvHuy7uscOLbmd1hR.jpg	2025-07-31	[12, 28, 14]		vf	hd	movie	57	t	2025-09-20 04:23:41.529318	2025-09-20 04:23:41.529318		
b3b1e5e9-2862-4c7c-bc7d-143afc091cc2	1188808	Tuhog		/kPKbdf3ESR1vHe2g7l8K0fSurez.jpg	/gEUWZCfCFW0KOLA3czpD5pDPIHL.jpg	2023-11-03	[18, 10749]		vf	hd	movie	56	t	2025-09-20 04:23:41.58946	2025-09-20 04:23:41.58946		
eac924d3-42a0-4575-b11b-baef0bf0ead1	1382406	Striking Rescue	Bai An, un ancien champion passé maître dans l'art du Muay Thaï est le témoin, impuissant, de l'assassinat brutal de sa femme et de sa fille par un puissant cartel qui empoisonne une majorité de la Thaïlande.	/aVta3Hmej6LEZ8oHQpf89TYPkBb.jpg	/yth78N88nwokepnOe5atwPGfTL1.jpg	2024-12-05	[28, 80, 53]		vf	hd	movie	76	t	2025-09-20 04:23:41.65372	2025-09-20 04:23:41.65372		
ece2f559-4234-442a-9bd2-5b18a926fb67	552524	Lilo & Stitch	Sur l'île d'Hawaï, une petite fille espiègle nommée Lilo adopte ce qu'elle croit être un chien étrange, qu'elle prénomme Stitch. Mais Stitch est en réalité une créature extraterrestre créée pour semer le chaos. Malgré son tempérament destructeur, il découvre peu à peu les valeurs de l’amitié, de l’amour et de la famille. Ensemble, Lilo et Stitch vont prouver qu’une vraie famille peut naître là où on s’y attend le moins.\r Un mélange d’humour, d’émotion et d’action dans cette réinvention en prises de vues réelles du classique animé de Disney.	/71IjwRa88OJMYJBntId7nn0eFHy.jpg	/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg	2025-05-17	[10751, 878, 35, 12]		vf	hd	movie	73	t	2025-09-20 04:23:41.719327	2025-09-20 04:23:41.719327		
96ce7eaa-93e5-49d3-a835-1c3dac725ab5	604079	Marche ou crève	Dans une Amérique totalitaire instaurée après une longue guerre fratricide, 50 jeunes hommes participent à une marche d'endurance de plus de 500 kilomètres, filmée et diffusée en direct. Les marcheurs ont l'obligation de conserver un rythme constant, avec interdiction formelle de s'arrêter. Après trois avertissements consécutifs, les contrevenants sont froidement abattus. Un seul en sortira vivant, avec une somme faramineuse et un prix de son choix. Habité par un motif secret, le jeune Raymond Garraty tente sa chance, nouant sur la route un fort lien d'amitié avec l'Afro-Américain Peter McVries.	/41wPG2nflDPez7wph5SKJhhBLzV.jpg	/pcJft6lFWsJxutwpLHVYfmZRPQp.jpg	2025-09-10	[27, 53, 878]		vf	hd	movie	72	t	2025-09-20 04:23:41.796708	2025-09-20 04:23:41.796708		
38fb648c-1d53-4ec1-90bb-96c5036becfa	541671	Ballerina	Enfant, Eve Macarro a assisté impuissante au meurtre de son père par une bande de tueurs à gages. Devenue adulte, elle consacre sa vie au ballet et… au combat. Formée selon les traditions ancestrales de la Ruska Roma, Eve est devenue une redoutable combattante - l'égale ou presque du légendaire John Wick, qu’elle croise parfois dans les couloirs de l’Hôtel Continental, à New York. Quand la Directrice la juge enfin prête pour une mission, Eve voit l'occasion de régler ses comptes avec les meurtriers de son père. Quitte à devoir affronter, au passage, John Wick lui-même.	/cAMk3C3uUbwSgoZ6EMoPjXI2tt.jpg	/sItIskd5xpiE64bBWYwZintkGf3.jpg	2025-06-04	[28, 53, 80]		vf	hd	movie	74	t	2025-09-20 04:23:41.873255	2025-09-20 04:23:41.873255		
eb7d60a6-cbcd-41cf-8b8c-a4c34b860787	1506456	Maalikaya		/4DJmVEm6JupITScpsSjyyrvOMGr.jpg	/38yqp1vsaGt11T713W4TzCrjstn.jpg	2025-07-25	[18, 10749]		vf	hd	movie	78	t	2025-09-20 04:23:41.937523	2025-09-20 04:23:41.937523		
ae755cff-5186-46fc-91ed-100c46e0d2df	246246	Beauty in Black	Le destin d'une strip-teaseuse bascule lorsqu'elle croise le chemin d'une famille dysfonctionnelle qui dirige un véritable empire cosmétique tout en mouillant dans un trafic tordu.	/lWXuQE4THNr86K7UllXHnibeCV4.jpg	/ywJcUIMTCjstPLvvyIiPWP3G3m3.jpg	2024-10-24	[18]		vf	hd	tv	75	t	2025-09-20 04:23:51.265938	2025-09-20 04:23:51.265938		
cfb47d97-e13b-4b9a-bdd5-c6c0fa9d9baa	138843	Conjuring : Les Dossiers Warren	Avant Amityville, il y avait Harrisville… Conjuring : Les dossiers Warren, raconte l'histoire horrible, mais vraie, d'Ed et Lorraine Warren, enquêteurs paranormaux réputés dans le monde entier, venus en aide à une famille terrorisée par une présence inquiétante dans leur ferme isolée… Contraints d'affronter une créature démoniaque d'une force redoutable, les Warren se retrouvent face à l'affaire la plus terrifiante de leur carrière.	/vOnTvcSsxdJWL9xgauljHHmFSN4.jpg	/fMlAg1CyHTsCktwQrp74rl9RMwJ.jpg	2013-07-18	[27, 53]		vf	hd	movie	75	t	2025-09-20 04:23:42.009435	2025-09-20 04:23:42.009435		
7d9c72cd-9b62-455c-a5cb-7bd6d476b84e	980477	Ne Zha 2	Après la catastrophe, bien que les âmes de Ne Zha et d'Ao Bing aient été sauvées, leurs corps sont menacés de destruction. Pour leur redonner vie, Taiyi Zhenren se tourne vers le lotus mystique aux sept couleurs dans une tentative audacieuse de les reconstruire et de changer leur destin.	/avdkkjd7As6z9HDcaHCVHvGuxVy.jpg	/zxi6WQPVc0uQAG5TtLsKvxYHApC.jpg	2025-01-29	[16, 14, 12, 28]		vf	hd	movie	80	t	2025-09-20 04:23:42.096842	2025-09-20 04:23:42.096842		
2d8d9c94-dd57-4f34-911e-4796a01f9fe7	1242434	Highest 2 Lowest	Soumis à une demande de rançon et confronté à un terrible dilemme moral, un puissant magnat de l'industrie musicale doit se battre pour sa famille et son héritage.	/h7SaZsd7E3t4c2IEyCOu1gj4DXf.jpg	/94KROr9xO9u5Tq5gTdCJlVRRfhm.jpg	2025-08-14	[53, 80, 18]		vf	hd	movie	58	t	2025-09-20 04:23:42.233303	2025-09-20 04:23:42.233303		
b7b87f54-bdac-4eb5-acb9-8a03bf1a81d8	1022787	Elio	Elio, un petit garçon à l'imagination débordante, qui se retrouve téléporté par inadvertance dans le Communivers, une organisation interplanétaire composée de représentants des galaxies les plus éloignées. Alors que tout l'univers le considère par erreur comme le chef de la Terre, Elio, loin d'être préparé à ce genre de pression, va devoir tisser de nouveaux liens avec d'étranges formes de vie extraterrestres, survivre à une série d'épreuves redoutables, pour finir par découvrir qui il est véritablement.	/jaKbruwD7KLlnprsse1zuOm4o2a.jpg	/lWeaB9S77Os7VHOt8GH5JdfrBX3.jpg	2025-06-18	[16, 10751, 35, 12, 878]		vf	hd	movie	69	t	2025-09-20 04:23:42.357846	2025-09-20 04:23:42.357846		
49efb7bb-c164-4630-9265-f702346af97b	1530127	Lookout	Une jeune femme décroche un emploi dans une tour de guet contre les incendies, mais des phénomènes surnaturels commencent à se produire.	/puQMWEXZ9wpqwniz9ac3MTAe6BB.jpg	/7U6sslMcPXPs9MIH5IvAl8ttTth.jpg	2025-09-02	[53, 878, 27]		vf	hd	movie	64	t	2025-09-20 04:23:42.522958	2025-09-20 04:23:42.522958		
9231ecb3-bd32-4e30-9227-ac25d0e3bfc8	1252428	狂蟒之灾		/9a7URTaq1Eimlg2ZujPX9FdOeGK.jpg	/gSVk4r8Q4R8aeGY0hhEG3bE0QzL.jpg	2024-03-01	[12, 27, 53]		vf	hd	movie	72	t	2025-09-20 04:23:42.655259	2025-09-20 04:23:42.655259		
868a9b07-967d-4adc-bb22-ea4132f5625b	1125257	Freaky Friday 2 : Encore dans la peau de ma mère	L’histoire a lieu des années après la crise d’identité subie par Tess et Anna, les personnages joués par Jamie Lee Curtis et Lindsay Lohan. Anna est à son tour mère d’une fille et aura bientôt une belle-fille. Confrontées aux défis que pose une famille recomposée, les deux femmes vont découvrir que dans leur cas, la foudre peut frapper deux fois au même endroit.	/wd4sdRTSCfcKnJSFWR5iMIQExd4.jpg	/dcLV5rEXuQRW0ZlB7IMLArHMyWh.jpg	2025-08-06	[35, 14, 10751]		vf	hd	movie	68	t	2025-09-20 04:23:42.789612	2025-09-20 04:23:42.789612		
bff88bd3-0c9c-46ad-a5cb-2c703d7fa0c6	660033	Comment je suis devenu un gangster	Un gangster ambitieux gravit les échelons de la pègre de Varsovie et finit par atteindre le sommet. A-t-il réellement réalisé son rêve ?	/kXfR0pprbVDKejYvppgO1U7XN4C.jpg	/pHvHLrbvMogNMH1l7Uon3VzE3px.jpg	2019-12-25	[80, 28]		vf	hd	movie	70	t	2025-09-20 04:23:42.8713	2025-09-20 04:23:42.8713		
db3e6c24-b5a4-4d8f-ade8-9b23d825f513	993234	Borders of love	Petr et Hana, qui après des années ensemble, décident de partager leurs fantasmes érotiques tacites. Ce qui commence comme une conversation innocente se transforme progressivement en expérimentation d'une approche non monogame de leur relation.	/x5KDA6ppG231uEd6mhG8YO4I04d.jpg	/4WixdIabyjYJy8Tyw4AUPOLxAo4.jpg	2022-11-03	[18, 10749]		vf	hd	movie	61	t	2025-09-20 04:23:44.382255	2025-09-20 04:23:44.382255		
c9c49953-3263-406e-9fc9-bad3b28c020d	1367575	A Line of Fire	Jack Conry alias « Cash » est un ancien agent du FBI chevronné. Après le décès de sa femme, il a laissé son ancienne vie derrière lui. Mais lorsque la nièce de son ancien partenaire n'a d'autre choix que de faire appel à lui, il reprend immédiatement du service. Danger, corruption, sombres intrigues… le monde a changé. Contrairement à l'efficacité redoutable de ses méthodes !	/6I5sZz7CMskXyaNK4mcdf25HRyq.jpg	/z8tNyAAnGk2d1XmO1L4i34UmP19.jpg	2025-04-05	[28, 53]		vf	hd	movie	63	t	2025-09-20 04:23:44.453368	2025-09-20 04:23:44.453368		
d7fb4d30-85ad-4e9b-a351-de833aacb7ac	1284120	The Ugly Stepsister	Dans un royaume où la beauté règne en maître, la jeune Elvira doit faire face à une féroce concurrence pour espérer gagner l’attention du prince. Parmi ses nombreuses rivales, se trouve notamment sa demi-sœur à la beauté insolente. Dans cette course effrénée à l’obtention du physique parfait, Elvira devra avoir recours aux méthodes les plus extrêmes.	/hRbaOImESNEJWC2SZ8qHXiRFm4i.jpg	/eQV9rSQ6S1ja4lGTwHTnQuVhoG.jpg	2025-03-07	[27, 35, 14, 18]		vf	hd	movie	72	t	2025-09-20 04:23:44.515949	2025-09-20 04:23:44.515949		
ac21c89b-df61-4c1f-8ed2-9c678ee1a50b	715287	새엄마의 욕망		/rYC6UyML4CU4zYiZVbDMrwnGyWW.jpg	/54mPXhtaUejdQtaCYeJPJP8ZfXX.jpg	2020-05-29	[18, 10749]		vf	hd	movie	72	t	2025-09-20 04:23:44.597875	2025-09-20 04:23:44.597875		
13121996-f2f8-4e3a-a3ae-68a5937ba802	994682	セクシー・オーラル 浮気な唇		/73htOFdGLPP2LekjMaZ6yC6zutc.jpg	\N	1984-02-17	[18]		vf	hd	movie	60	t	2025-09-20 04:23:44.667099	2025-09-20 04:23:44.667099		
ba54308f-05b8-49c5-8bfb-d56b8958dc34	1470086	Ligaw		/xpGQxXQwm1zdzQ8bN98hEmojZOl.jpg	/heMsXGykub43tU79I9hv6T1vHRc.jpg	2025-05-09	[18, 10749]		vf	hd	movie	72	t	2025-09-20 04:23:44.732796	2025-09-20 04:23:44.732796		
6f399db2-2efc-484e-8598-d7e1e5ec4a95	1083433	Souviens-toi… l'été dernier	Lorsque cinq amis causent involontairement un accident de voiture mortel, ils décident de dissimuler leur implication et concluent un pacte pour garder le secret plutôt que de faire face aux conséquences de ce terrible évènement. Un an plus tard, leur passé revient les hanter et ils sont confrontés à une terrible vérité : quelqu'un sait ce qu'ils ont fait l'été dernier... et est déterminé à se venger. Traqués un à un par un mystérieux tueur, ils découvrent que cela s'est déjà produit auparavant et se tournent vers deux survivants du terrible Massacre de Southport de 1997 dans l’espoir d’obtenir leur aide.	/mLKQtg75oAx3L5prBuzfr7zWQBw.jpg	/gVPjIcYo1gTaACF43OMsralrcUS.jpg	2025-07-16	[27, 9648, 53]		vf	hd	movie	60	t	2025-09-20 04:23:44.807804	2025-09-20 04:23:44.807804		
eaa78521-a2e5-46d0-ac77-add24b67b2b4	62576	LEGO Marvel Super Héros : Puissance maximum	Spider Man et le S.H.I.E.L.D. n'ont pas une minute à perdre quand Loki décide de constituer une armée pour régner sur le monde.	/6JaUKywvJyq7g7qDTRYW6s3ZRm9.jpg	/2nXKdWx5X3QKA3FFnBdG1qjvcFW.jpg	2013-11-05	[16, 10762]		vf	hd	tv	65	t	2025-09-20 14:14:18.571612	2025-09-20 14:14:18.571612		
7f541004-5330-41eb-93af-1fb0ab5e024a	574475	Destination finale : Bloodlines	Stefani, 18 ans, fait d’affreux cauchemars. Dans ceux-ci, elle voit sa grand-mère échapper à la mort dans un accident qui aurait dû la tuer il y a 50 ans. Son ancêtre a réussi alors à esquiver le décès jusqu’à l’âge de 80 ans ou elle meurt de façon naturelle. À cause de ce miracle, toute sa descendance doit quelque chose à la mort.	/4uI8C2zcfLWRhZDBgd0oTlZjV9j.jpg	/uIpJPDNFoeX0TVml9smPrs9KUVx.jpg	2025-05-14	[27, 9648]		vf	hd	movie	71	t	2025-09-20 04:23:44.898624	2025-09-20 04:23:44.898624		
f1bb16bc-1ecf-4ddd-ade0-b1dc1427af9c	1354441	La hacienda: El regreso de los malditos		/vXUfuM7tPvAL8HjjnsFO4yYbKUs.jpg	\N	2025-03-09	[27]		vf	hd	movie	55	t	2025-09-20 04:23:45.085872	2025-09-20 04:23:45.085872		
7552710f-41d2-4743-9d31-0078e31e2bce	157336	Interstellar	Dans un futur proche, face à une Terre exsangue, un groupe d’explorateurs utilise un vaisseau interstellaire pour franchir un trou de ver permettant de parcourir des distances jusque‐là infranchissables. Leur but : trouver un nouveau foyer pour l’humanité.	/1pnigkWWy8W032o9TKDneBa3eVK.jpg	/vgnoBSVzWAV9sNQUORaDGvDp7wx.jpg	2014-11-05	[12, 18, 878]		vf	hd	movie	85	t	2025-09-20 04:23:45.222656	2025-09-20 04:23:45.222656		
baa9a269-f118-4912-948d-682ab797e457	70196	Le Vétéran	En rentrant d’Afghanistan, Robert Miller, un parachutiste vétéran, découvre sa ville natale en proie à une guerre des gangs. Après avoir rejeté l'offre d'un truand qui le voulait dans ses rangs, Robert est embauché par des agents du gouvernement pour une mission sous couverture. Toutefois, il se rend compte que, de ce côté, une dangereuse manipulation s'opère.	/i1gSsXTWtCmNQArmIeUpAysHEmi.jpg	/bZldcoIeFwg8A0x3VGsMjVPtv69.jpg	2011-04-29	[28, 80, 53]		vf	hd	movie	58	t	2025-09-20 04:23:45.315559	2025-09-20 04:23:45.315559		
3292203c-cd3b-4a05-a2ab-1d787df33877	423108	Conjuring : Sous l'emprise du Diable	Une histoire de meurtre bouleverse Ed et Lorraine Warren. L'âme d'un jeune garçon est menacée et pour la première fois aux États-Unis, un accusé de meurtre plaide la possession démoniaque comme défense.	/k0JaMRifwHCk9b1T12koZKqXnnS.jpg	/6Z0FhoZM56YkuXhvklMTpc7rc5u.jpg	2021-05-25	[27, 9648, 53]		vf	hd	movie	74	t	2025-09-20 04:23:45.406376	2025-09-20 04:23:45.406376		
7022daf7-f5a0-49b4-abeb-37bf82aa6282	1151031	Substitution - Bring Her Back	Un frère et une sœur découvrent un rituel terrifiant dans la maison isolée de leur nouvelle famille d’accueil.	/AjBNmvAUbl8RMMYmv1dFfP9I1II.jpg	/2IIKts2A9vnUdM9tTC76B8tDmuZ.jpg	2025-05-28	[27]		vf	hd	movie	74	t	2025-09-20 04:23:45.485582	2025-09-20 04:23:45.485582		
07f3c92d-602c-4b84-8b9e-8e9864c0aa25	1071585	M3GAN 2.0	Deux ans ont passé depuis la destruction de M3GAN, le prototype à la pointe de l’intelligence artificielle devenu incontrôlable lors d’un carnage aussi sanglant qu’impeccablement chorégraphié. Sa créatrice Gemma aujourd’hui auteure de renom milite pour l’encadrement drastique des I.A. par le gouvernement, alors que Cady, sa nièce de 14 ans entre dans l’adolescence et se rebelle contre les règles trop strictes de sa tante. Cependant, à l’insu de tous, la technique de pointe mise au point pour M3GAN a été volée et détournée pour créer une arme militaire connue sous le nom d'AM3LIA.	/jRbw7bt9ftolX0GNcCvJdoHKdUq.jpg	/cT9ZfwoPDk8JbgkessmQgxAWiaM.jpg	2025-06-25	[28, 878, 53]		vf	hd	movie	75	t	2025-09-20 04:23:45.564029	2025-09-20 04:23:45.564029		
e5c1e280-19cb-4a01-9b90-086541085cb0	1088166	L'Intermédiaire	Ash négocie des pots-de-vin entre des sociétés corrompues et les individus qui menacent leur ruine. Il garde son identité secrète. Lorsqu'un jour un message arrive de Sarah, une cliente potentielle, qui a besoin de sa protection afin de rester en vie.	/oH1LinZ5p4zbIYM7e2g1N37WXPS.jpg	/1ZnEOaOUj2e2Fq6Y7wo9KeH5rS6.jpg	2025-08-21	[53, 18]		vf	hd	movie	71	t	2025-09-20 04:23:45.633827	2025-09-20 04:23:45.633827		
fcd21c48-fb19-4a12-bcc3-f0a08e68b9d8	1403735	లైలా		/l4gsNxFPGpzbq0D6QK1a8vO1lBz.jpg	/vNUwK5P42m81uG57kKI1WxSZwIQ.jpg	2025-02-14	[35, 10749]		vf	hd	movie	58	t	2025-09-20 04:23:45.705776	2025-09-20 04:23:45.705776		
2fc5efd7-1004-4841-a553-b21b2fa69466	974397	My Freaky Family		/h34lkT2CFufYuzmP0CEgn4lghyY.jpg	/qDAvAUsnRrvkFO5EtNq1XFfyYTL.jpg	2024-04-25	[16, 10751, 14]		vf	hd	movie	70	t	2025-09-20 04:23:46.031198	2025-09-20 04:23:46.031198		
0ba4fe02-d568-4e68-9bd9-6f5343c331a5	1163545	Lubuk		/eetln9XQpMc2GrWfKNJXrN7NdDr.jpg	/SiLiMbpWFtIa64wvp3WxbpzOen.jpg	2024-07-18	[53]		vf	hd	movie	0	t	2025-09-20 04:23:46.22384	2025-09-20 04:23:46.22384		
72c28680-0239-4430-826a-a7d59c4cb8cd	1185528	La Légende des Héros du Condor	La redoutable armée mongole, menée par Gengis Khan, se met en marche vers la Chine avec pour objectif d’anéantir la dynastie Jun à l’ouest et la dynastie Song au sud. Les puissants maîtres d'arts martiaux de plusieurs écoles vont unir leurs forces pour leur faire face et devenir des héros nationaux.	/62cOJG4fgsvdSd3d389w59orMuU.jpg	/1DTIRhw4cpLJlHlrPPbKzq6amHc.jpg	2025-01-29	[28, 18, 36]		vf	hd	movie	68	t	2025-09-20 04:23:46.340611	2025-09-20 04:23:46.340611		
978631f4-f2c7-42ef-8b86-d552ee4a5405	119051	Mercredi	Brillante, sarcastique et un peu morte à l'intérieur, Mercredi Addams enquête sur une série de sombres mystères tout en se faisant des amis à l'Académie Nevermore.	/1UzED7WZJgzEIeVz1xiuZ1529nb.jpg	/iHSwvRVsRyxpX7FE7GbviaDvgGZ.jpg	2022-11-23	[10765, 9648, 35]		vf	hd	tv	84	t	2025-09-20 04:23:47.769808	2025-09-20 04:23:47.769808		
49aa74c4-75a2-4e24-8fd5-7e86a7b4854b	194766	L'Été où je suis devenue jolie	Isabel "Belly" Conklin passe ses étés à Cousin's Beach avec sa mère et son frère aîné, ainsi que le meilleur ami de sa mère et ses fils. Au cours d'un été bien précis, elle va connaître son premier amour mais aussi sa première peine de cœur.	/1UjOeSZHunQqpSimmobGCWzkuXh.jpg	/jCcSS9iDpKgll8Kpp7qVhSn0l1f.jpg	2022-06-16	[18]		vf	hd	tv	82	t	2025-09-20 04:23:47.850212	2025-09-20 04:23:47.850212		
5a9911cf-eff0-4a4f-aa25-4969dec3dae4	157239	Alien: Earth	Lorsqu'un mystérieux vaisseau spatial s'écrase sur la Terre, une jeune femme et un groupe hétéroclite de soldats tactiques font une découverte fatidique qui les amène à affronter la plus grande menace que la planète ait connue. Alors que les membres de l'équipe dépêchée pour récupérer l'épave recherchent des survivants, ils rencontrent des formes de vie prédatrices absolument terrifiantes. Face à cette nouvelle menace, l'équipe doit se battre pour survivre et faire des choix qui pourraient changer la Terre à jamais.	/iDq3avrUgFsAbTEJhRNtmo5aUWA.jpg	/biIBy2LPOOtGCgUYOls3dUEWU3v.jpg	2025-08-12	[10765, 18]		vf	hd	tv	77	t	2025-09-20 04:23:47.927895	2025-09-20 04:23:47.927895		
d28770d7-9cfa-4ada-b7fc-9e7a3abc4999	1405	Dexter	Brillant expert scientifique du service médico-légal de la police de Miami, Dexter Morgan est spécialisé dans l'analyse de prélèvements et d'éclaboussures de sang. Mais Dexter cache un terrible secret : c'est également un tueur en série ! Un serial killer pas comme les autres, avec sa propre vision de la justice, qui, grâce au code fourni par son père adoptif, ne s'en prend qu'à des personnes coupables de meurtres affreux ou de délits répréhensibles. Mais Dexter n'attend pas que la justice les libère ou les relâche, faute de preuves. Il les assassine, avant même que la police ne remonte jusqu'à eux et efface ses traces. Sa demi-sœur, Debra, travaille dans le même commissariat que lui et n'a de cesse de traquer tous les meurtriers, quels qu'ils soient... sans savoir qu'elle en fréquente un, tous les jours !	/ptQtKhlJYtPlp5ecvJXvIGyjCjf.jpg	/aSGSxGMTP893DPMCvMl9AdnEICE.jpg	2006-10-01	[80, 18, 9648]		vf	hd	tv	82	t	2025-09-20 04:23:48.017785	2025-09-20 04:23:48.017785		
5be8db0f-51e4-4cd8-b121-74d648e2e78b	2734	New York Unité Spéciale	Les inspecteurs qui font partie de la division des Crimes sexuels (SVU) du service de police de la ville de New York (NYPD) enquêtent sur des crimes de nature sexuelle. Alors que les autres émissions de la franchise de "La loi et l'ordre" se sont largement concentrées sur les cas de meurtres, les inspecteurs de la division des Crimes sexuels (SVU) ont souvent affaire à des crimes, tel le viol, auquel la victime survit et elle aide les autorités lors de l'enquête.	/uZsDRMQawpCySFOmlTv7hPtXRyY.jpg	/oRdc2nn7jLOYy4fBdvmFKPsKzZE.jpg	1999-09-20	[80, 18, 9648]		vf	hd	tv	79	t	2025-09-20 04:23:48.110922	2025-09-20 04:23:48.110922		
37d21440-c379-4943-9e5e-cab9137f7815	79744	The Rookie : Le Flic de Los Angeles	Lorsque sa femme le quitte et que son fils part à la fac, John Nolan, la quarantaine, est à un tournant de sa vie et décide de réaliser un vieux rêve : devenir flic ! Il part vivre à Los Angeles et se retrouve, malgré son âge, un bleu parmi les bleus...	/z2Y1msHaUil83t2WJyszlsacEgJ.jpg	/2m1Mu0xPj4SikiqkaolTRUcNtWH.jpg	2018-10-16	[80, 18, 35]		vf	hd	tv	85	t	2025-09-20 04:23:48.181522	2025-09-20 04:23:48.181522		
cf306a81-a7dc-4b79-a068-ea405a2cebfa	1416	Grey's Anatomy	Meredith Grey, fille d'un chirurgien très réputé, commence son internat de première année en médecine chirurgicale dans un hôpital de Seattle. La jeune femme s'efforce de maintenir de bonnes relations avec ses camarades internes, mais dans ce métier difficile la compétition fait rage.	/meLc14IucQOzlqRn3ERCWjt5BEC.jpg	/fgvM6m7gAd8kDAaLF16aflbOSAK.jpg	2005-03-27	[18]		vf	hd	tv	82	t	2025-09-20 04:23:48.255806	2025-09-20 04:23:48.255806		
d65c1a66-84fe-49ac-87fe-9e0bcdab12dd	549	New York, police judiciaire	À New York, détectives et assistants du procureur tentent de résoudre les affaires les plus délicates. Les uns sur le terrain, les autres devant les tribunaux.	/rXp8dYYdEPLTq8LUbWReOCSkvgt.jpg	/4uWvmON2pqDJtpPAsHMggdDFFrn.jpg	1990-09-13	[80, 18]		vf	hd	tv	74	t	2025-09-20 04:23:48.33167	2025-09-20 04:23:48.33167		
3d5c1639-6602-4732-855f-54c92882fe4a	1622	Supernatural	Deux frères, Sam et Dean Winchester, chasseurs de créatures surnaturelles, sillonnent les États-Unis à bord d'une Chevrolet Impala noire de 1967 et enquêtent sur des phénomènes paranormaux (souvent issus du folklore, des superstitions, mythes et légendes urbaines américaines, mais aussi des monstres surnaturels tels que les fantômes, loups-garous, démons, vampires…).	/iBR4U3MZelj5avBqqs1SJpIqArP.jpg	/lirPqYLTtd6XZqGn4cS1wiesTq0.jpg	2005-09-13	[18, 9648, 10765]		vf	hd	tv	83	t	2025-09-20 04:23:48.402586	2025-09-20 04:23:48.402586		
49d7171e-0d45-465e-868b-ed6c7a95e7b6	205715	Gen V	De The Boys est née Génération V, nouvelle série sur la seule université américaine pour super-héros. Ces étudiants doués mettent à l'épreuve leur morale, s'affrontant pour une place au sommet du classement et une chance de rejoindre les Sept, l'équipe de super-héros d'élite de Vought. Quand les secrets de l'école sont révélés, ils doivent choisir à quelle sorte de super-héros ils veulent appartenir.	/uXBUB5BQAQjIoyzstmzYYoqSbIh.jpg	/ScaVfT5IkwVC3Edhmxqyl0GbK0.jpg	2023-09-28	[10759, 18, 10765]		vf	hd	tv	77	t	2025-09-20 04:23:48.468071	2025-09-20 04:23:48.468071		
5d1f68b7-6f60-4438-be8b-9c737fb68762	4614	NCIS : Enquêtes spéciales	À la tête de cette équipe du NCIS, qui opère en dehors de la chaîne de commandement militaire, l'agent Special Leroy Jethro Gibbs, un enquêteur qualifié dont les qualités sont d'être intelligent, solide et prêt à contourner les règles pour faire le travail. Travaillant sous les ordres de Gibbs, on retrouve l'agent Anthony DiNozzo, l'agent Abby Sciuto et le Dr Donald "Ducky" Mallard. De meurtre en espionnage anti-terrorisme et sous-marins volés, ces agents spéciaux parcourent la planète pour enquêter sur tous les crimes ayant un lien avec l'US Navy ou l'US Marine Corps.	/mBcu8d6x6zB1el3MPNl7cZQEQ31.jpg	/c1aBrG5s5xFa6Tbnihu2Hhj4t2q.jpg	2003-09-23	[80, 18, 10759]		vf	hd	tv	76	t	2025-09-20 04:23:48.548805	2025-09-20 04:23:48.548805		
d6f9441c-09f8-4608-b443-34c0e7410888	1399	Game of Thrones	Il y a très longtemps, à une époque oubliée, une force a détruit l'équilibre des saisons. Dans un pays où l'été peut durer plusieurs années et l'hiver toute une vie, des forces sinistres et surnaturelles se pressent aux portes du Royaume des Sept Couronnes. La confrérie de la Garde de Nuit, protégeant le Royaume de toute créature pouvant provenir d'au-delà du Mur protecteur, n'a plus les ressources nécessaires pour assurer la sécurité de tous. Après un été de dix années, un hiver rigoureux s'abat sur le Royaume avec la promesse d'un avenir des plus sombres. Pendant ce temps, complots et rivalités se jouent sur le continent pour s'emparer du Trône de fer, le symbole du pouvoir absolu.	/eRMfekBOnwyE9G0ffyEJIBOjX2n.jpg	/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg	2011-04-17	[10765, 18, 10759]		vf	hd	tv	85	t	2025-09-20 04:23:48.620691	2025-09-20 04:23:48.620691		
a8cacdca-babd-401b-81e3-0a13fe74ed0b	219760	The Terminal List: Dark Wolf	Plusieurs années avant les événements de La Liste Terminale, les Navy SEAL Ben Edwards et Raife Hastings se retrouvent impliqués dans une conspiration d'espionnage international alors qu'ils sont affectés à la CIA. Cependant, dans les opérations secrètes, personne n'en ressort indemne. Ce ne sont pas seulement des vies qui sont perdues. Parfois, c'est votre âme.	/b8WRS5ZBXuZfY9qnV80o5PBIuvc.jpg	/yQw23xxmVBFVHPCF6V68TAIIfno.jpg	2025-08-27	[10759, 18]		vf	hd	tv	78	t	2025-09-20 04:23:48.701694	2025-09-20 04:23:48.701694		
632d2ce8-df33-4938-85b1-cc0755bead77	2288	Prison Break	Michael Scofield s'engage dans une véritable lutte contre la montre : son frère Lincoln est dans le couloir de la mort, en attente de son exécution. Persuadé de son innocence mais à court de solutions, Michael décide de se faire incarcérer à son tour dans le pénitencier d'état de Fox River pour organiser leur évasion...	/6chvwfFcJPE97lhFwuQzhldgsee.jpg	/7w165QdHmJuTHSQwEyJDBDpuDT7.jpg	2005-08-29	[10759, 80, 18]		vf	hd	tv	81	t	2025-09-20 04:23:48.773696	2025-09-20 04:23:48.773696		
d6138f82-625c-4ba7-81c7-9bf68b792e84	1396	Breaking Bad	Un professeur de chimie atteint d'un cancer s'associe à un ancien élève pour fabriquer et vendre de la méthamphétamine afin d'assurer l'avenir financier de sa famille.	/tP2wgZfzkZxL18jImD2YXqEUXQA.jpg	/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg	2008-01-20	[18, 80]		vf	hd	tv	89	t	2025-09-20 04:23:48.842371	2025-09-20 04:23:48.842371		
e044d026-14ef-43a4-87c0-7de7ff464aca	34307	Shameless	Pour les enfants Gallagher, la vie est tout sauf un long fleuve tranquille... Fiona, l'aînée, âgée de 20 ans, élève du mieux possible sa soeur et ses quatre frères. Leur mère, Monica, les a abandonnés pour refaire sa vie avec une femme. Quant à leur père, Frank, paumé, chômeur et alcoolique, il dilapide l'argent des allocations familiales...	/9akij7PqZ1g6zl42DQQTtL9CTSb.jpg	/zjOj2gnDJYFdYt6R7FtuHn7yrPr.jpg	2011-01-09	[18, 35]		vf	hd	tv	82	t	2025-09-20 04:23:48.901138	2025-09-20 04:23:48.901138		
e87f20ae-36df-42de-8270-abf698d7361f	246485	Les Mortes	L'histoire des sœurs Baladro, patronnes d'une chaîne de maisons closes et tueuses sans pitié dans le Mexique des années 60. Une série inspirée du roman de Jorge Ibargüengoitia.	/29ZbaC0KP7Oks6JXQLhtB99FFFQ.jpg	/rmIQiFYnTDttJMehqkw2GEaO18Y.jpg	2025-09-10	[18, 80]		vf	hd	tv	75	t	2025-09-20 04:23:48.96939	2025-09-20 04:23:48.96939		
78541aae-22f0-4e51-b930-070901c89b54	4057	Esprits criminels	L'équipe des profilers étudie les comportements et les esprits torturés des criminels les plus dangereux du pays, afin d'anticiper les crimes d'un éventuel tueur. Chaque membre de cette unité d'élite a sa personnalité, son histoire mais aussi sa spécialité. Ils sont tous dépendants les uns des autres et les résultats dépendent aussi de cette complémentarité.	/kRgsJq9dMz7bIciUEqwbmzFBwSL.jpg	/w88B4ooZ2LSYPw5107JOkjvI8PI.jpg	2005-09-22	[80, 18, 9648]		vf	hd	tv	83	t	2025-09-20 04:23:49.041669	2025-09-20 04:23:49.041669		
36994de9-f1ff-4438-babf-16d46002bc17	110492	Peacemaker	Laissé pour mort après sa confrontation avec Bloodsport lors de leurs mission sur l'île de Corto Maltese avec la Task Force X, Christopher Smith, alias le Peacemaker, a en réalité survécu. Il est retrouvé par l'équipe d'Amanda Waller afin de lui confier de nouvelles missions.	/zS3B0E62iVX9cmiEkToD2JMrne0.jpg	/pj1wFbZF3gpEg7F0EreXTvZNZTG.jpg	2022-01-13	[10759, 10765, 18]		vf	hd	tv	82	t	2025-09-20 04:23:49.10931	2025-09-20 04:23:49.10931		
44e2116f-914f-4137-a59a-f821c361b532	211684	The Walking Dead : Daryl Dixon	Daryl Dixon se réveille quelque part sur le continent européen et essaie de reconstituer ce qui s'est passé. Comment est-il arrivé ici ? Comment va-t-il rentrer chez lui ?	/sP5QdW9FN18XWcA4ROz3MPAQBTx.jpg	/g0eOZeci2vcrM0oxuiEJUR94ff7.jpg	2023-09-10	[10765, 10759, 18]		vf	hd	tv	81	t	2025-09-20 04:23:49.168098	2025-09-20 04:23:49.168098		
bfa0bd6d-4241-4390-9702-b83685e6213c	1434	Les Griffin	La famille Griffin habite à Quahog, charmante petite bourgade américaine. Peter, le père, a érigé la fainéantise en philosophie de vie. Lois, la mère, est à la fois la femme au foyer bonne à tout faire et le cerveau de la famille. Chris, le fils, a hérité de son père ses formes généreuses et ses préoccupations favorites sont manger, surfer sur le web et manger. Megan, la fille, est l'archétype de l'adolescente en crise : elle ne s'aime pas et, en même temps, attend désespérément son prince. Stewie, le petit dernier, a pour ambition de conquérir le monde. Même Brian, le chien, est complètement fou, ou plutôt très intelligent : il parle, philosophe, débat... Bienvenue chez les Griffin !	/7nHl3OHUSTHgslQxJUzNSy9vxqo.jpg	/lgGZ2ysbRyAOi2VgIZpp6k8qILj.jpg	1999-01-31	[16, 35]		vf	hd	tv	74	t	2025-09-20 04:23:50.637686	2025-09-20 04:23:50.637686		
3c1b8a44-586d-4c14-ba94-ec83f7bc621a	46952	Blacklist	Raymond « Red » Reddington, l’un des fugitifs les plus recherchés par le FBI, se rend en personne au quartier général du FBI à Washington. Il affirme avoir les mêmes intérêts que le FBI : faire tomber des criminels dangereux et des terroristes. Reddington coopérera, mais insiste pour ne parler qu’à Elizabeth Keen, une profileuse inexpérimentée du FBI. Keen s’interroge sur l’intérêt soudain que Reddington lui porte, bien qu’il soutienne que Keen est très spéciale. Après que le FBI a fait tomber un terroriste sur lequel il a fourni des informations, Reddington révèle que ce terroriste n’est que le premier de beaucoup d’autres à venir : durant les deux dernières décennies, il a fait une liste des criminels et terroristes qu'il croit introuvable par le FBI parce que ce dernier ignorait leur existence et que ce sont les plus importants. Reddington l’appelle « La Liste noire » (« The Blacklist »).	/dIR6njcRuUtX3ShXECil3a2W5U7.jpg	/2eIlCirgcvEwmCSYh2wDfz5Sxvz.jpg	2013-09-23	[18, 80, 9648]		vf	hd	tv	76	t	2025-09-20 04:23:50.717251	2025-09-20 04:23:50.717251		
7079aaae-1c6a-4f46-8e83-aff9e8f8b4eb	283123	Eşref Rüya		/eeFYLgiRFaG3bKx1qLyC7YOdHJz.jpg	/ngQOGhD2z184jrLL7rrSdcJJ3sT.jpg	2025-03-19	[18]		vf	hd	tv	72	t	2025-09-20 04:23:50.788197	2025-09-20 04:23:50.788197		
bfc5ac99-91dc-49a8-9e60-889fe47c5a4d	456	Les Simpson	Située à Springfield, ville américaine moyenne, la série se concentre sur les singeries et les aventures quotidiennes de la famille Simpson : Homer, Marge, Bart, Lisa et Maggie, ainsi que des milliers d'autres personnages.	/ffE3h13G2LYl6al2MsRGrKIpMYF.jpg	/jvTeRgjFsp66xj8SWxhr7O2J4ud.jpg	1989-12-17	[10751, 16, 35]		vf	hd	tv	80	t	2025-09-20 04:23:50.854577	2025-09-20 04:23:50.854577		
168fb42a-1d9e-49e1-8f3c-1c725100794d	1408	Dr House	Le docteur Gregory House, est un brillant médecin à tendance misanthrope qui dirige une équipe d'internistes au sein de l'hôpital fictif de Princeton-Plainsboro dans le New Jersey. House est un personnage arrogant, cynique, anticonformiste et asocial. Il souffre d'une claudication provenant d'une douleur chronique à la jambe droite due à un infarctus du muscle de la cuisse. Il marche avec une canne et abuse de Vicodin, un analgésique opiacé, pour soulager sa douleur.	/tS3c86kDSlaSUDbjpGpxrQdXsx2.jpg	/r0Q6eeN9L1ORL9QsV0Sg8ZV3vnv.jpg	2004-11-16	[18, 9648, 35]		vf	hd	tv	86	t	2025-09-20 04:23:50.931529	2025-09-20 04:23:50.931529		
af8dd06f-1e56-441d-9290-65ac28bc02e8	249039	Black Rabbit	Un restaurateur en pleine ascension est contraint de tremper dans le milieu criminel new-yorkais après le retour de son frère chaotique, harcelé par des usuriers impitoyables.	/LE2S6ukIczaefPhuHkk2Om4VV5.jpg	/l7rLHTBhCJ0Ub7ctAh9Vesx6ACK.jpg	2025-09-18	[18, 80]		vf	hd	tv	68	t	2025-09-20 04:23:50.998136	2025-09-20 04:23:50.998136		
2466d612-e0f0-47e7-b02d-e6cd954aab43	280945	Bon Appétit, Your Majesty	Une grande cheffe voyage dans le temps jusqu'à l'ère Joseon et y rencontre un roi. Si ses plats contemporains ravissent le palais du tyran, elle n'est pas au bout de ses peines.	/6Eer9rz33LFfkkGlZM4QVBBrlBd.jpg	/9QwPn3hV58ESYzT6YbWPzGJ9SjG.jpg	2025-08-23	[10765, 18]		vf	hd	tv	90	t	2025-09-20 04:23:51.062376	2025-09-20 04:23:51.062376		
b910818e-bcd7-4f5e-aff3-45b1f33f07d6	196890	Chief of War	Comme les quatre royaumes d'Hawaiʻi sont déchirés par la guerre, le féroce guerrier Kaʻiana se lance dans une mission monumentale pour unir son peuple, alors qu'une sombre menace se rapproche.	/hMCcvWVnsnlhaBaHV4g4nDpcdB4.jpg	/2c3PCbxVgWen5HrYsaukUmfu4J9.jpg	2025-07-31	[18]		vf	hd	tv	73	t	2025-09-20 04:23:51.126312	2025-09-20 04:23:51.126312		
d7b39a0c-fdc3-474f-82b1-1e282bc3782b	764	Inspecteur Barnaby	L'inspecteur Barnaby, accompagné de son adjoint, enquêtent sur les crimes commis dans la région anglaise fictive du Midsomer...	/yYk4Ju1A5jDGZ3jsNlicoeLni6c.jpg	/qVmgq1KXBp6BF2EqYPPaUG9iUGy.jpg	1997-03-23	[80, 18, 9648]		vf	hd	tv	75	t	2025-09-20 04:23:51.192637	2025-09-20 04:23:51.192637		
4211223d-d361-42da-973d-e9a6f73b9893	1431	Les Experts	À Las Vegas, un groupe d'experts scientifiques de la police recueille des indices sur les scènes de crime pour résoudre des enquêtes complexes. Un temps conduite par Gil Grissom, un entomologiste qui garde toujours son sang-froid, l'équipe enchaîne les affaires délicates : meurtres sanglants, viols, disparitions, leur taux d'efficacité est impressionnant. D.B. Russell, qui prend la suite des opérations après le départ de Gil Grissom et l'intérim de Raymond Langston, tente de maintenir la réputation d'excellence du service.	/fx304X0L9dykk0yZixBfhUDqH53.jpg	/cvlLBcQWpO9X21jDHhgPJnE2aVq.jpg	2000-10-06	[80, 18, 9648]		vf	hd	tv	76	t	2025-09-20 04:23:51.343645	2025-09-20 04:23:51.343645		
57a7fe16-2f39-48b5-acc7-d5ff2d597bb2	44217	Vikings	Les exploits d'un groupe de vikings de la fin du 8ème siècle jusqu'au milieu du 11ème, mené par Ragnar Lodbrok, l'un des plus populaires héros viking de tous les temps, qui a régné quelques temps sur le Danemark et la Suède...	/xmcOeS0BKCBg5MwM3dfMrSUqyNh.jpg	/lHe8iwM4Cdm6RSEiara4PN8ZcBd.jpg	2013-03-03	[10759, 18, 10768]		vf	hd	tv	81	t	2025-09-20 04:23:51.411221	2025-09-20 04:23:51.411221		
fee37832-d3b3-4214-aa2d-4007d627eb9a	5920	Mentalist	Un mentaliste utilise ses extraordinaires dons d'observation pour résoudre des crimes en tant que consultant du CBI. Une façon pour lui de contribuer à la justice et de démasquer le mystérieux tueur en série qui a assassiné son épouse et sa fille...	/tX9UXgTEVPg9w9hd3SHPfKh75zc.jpg	/q3pCsNvJ7CmdJUz2sJEEUY3pOPC.jpg	2008-09-23	[80, 18, 9648]		vf	hd	tv	84	t	2025-09-20 04:23:51.489085	2025-09-20 04:23:51.489085		
f1fb033e-3a18-475d-9407-738e0e39e290	207468	Kaiju No. 8	Dans un monde en proie à des d’effroyables monstres géants connus sous le nom de kaiju, Kafka Hibino aspire à rejoindre un jour les Forces de Défense pour combattre ces terribles créatures. C’était un rêve qu’il avait avec son amie d’enfance, Mina Ashiro, mais leurs chemins ont pris des directions différentes. Aujourd’hui, Kafka nettoie les rues de leurs encombrants cadavres quand il croise la route de Reno Ichikawa. La détermination de Reno à rejoindre les Forces de Défense pousse Kafka à rejoindre Mina afin de protéger l’humanité.	/A6JOsCdFFTxtbDnKAfE0iY6jOiE.jpg	/9DrORnlwnjt5SeJKcuE5sqOoIdV.jpg	2024-04-13	[16, 10759, 10765]		vf	hd	tv	85	t	2025-09-20 04:23:51.574337	2025-09-20 04:23:51.574337		
0a37a72e-4523-4156-906b-0f100bccc4d2	1911	Bones	Temperance Brennan est une anthropologue hautement qualifiée qui travaille à l'Institut Jeffersonian. En examinant les squelettes de personnes décédées, elle est capable d'en reconstituer la vie et les circonstances de la mort. De telles capacités n'échappent pas au FBI qui fait appel à ses services dans le cadre d'affaires criminelles lorsque les méthodes traditionnelles d'identification des corps ne donnent rien. Temperance travaille en collaboration avec l'agent spécial Seeley Booth, ancien sniper de l'armée qui se méfie de la science et des scientifiques.	/jY8jLmNzWEsnHlTuI5FSzAb1ouo.jpg	/4AXxajuAz9tHAOe6h5zDg8z1X2s.jpg	2005-09-13	[80, 18]		vf	hd	tv	82	t	2025-09-20 04:23:51.650496	2025-09-20 04:23:51.650496		
013c451b-c2f3-4a3c-819c-f9f6704f0e24	37680	Suits, avocats sur mesure	Avocat très ambitieux d'une grosse firme de Manhattan, Harvey Specter a besoin de quelqu'un pour l'épauler. Son choix se porte sur Mike Ross, un jeune homme très brillant mais sans diplôme, doté d'un talent certain et d'une mémoire photographique très précieuse. Ensemble, ils forment une équipe gagnante, prête à relever tous les défis. Mike devra cependant user de toutes les ruses pour maintenir sa place sans que personne ne découvre qu'il n'a jamais passé l'examen du barreau.	/tVqvztjig1o001EAAZs9wCs3bV6.jpg	/or0E36KfzJYZwqXeiCfm1JgepKF.jpg	2011-06-23	[18]		vf	hd	tv	82	t	2025-09-20 04:23:51.719261	2025-09-20 04:23:51.719261		
d6409e36-44f7-498c-929d-348d93b4062e	73586	Yellowstone	Dans le Montana, la famille Dutton possède le plus grand ranch des États-Unis près du parc national de Yellowstone. Menée par le patriarche John, la famille se bat contre des politiciens et des promoteurs immobiliers.	/s4QRRYc1V2e68Qy9Wel9MI8fhRP.jpg	/ynSOcgDLZfdLCZfRSYZGiTgYJVo.jpg	2018-06-20	[37, 18]		vf	hd	tv	83	t	2025-09-20 04:23:51.794984	2025-09-20 04:23:51.794984		
a6e13926-790a-4080-9a73-41e57581978a	93740	Foundation	Inspirée des romans primés d'Isaac Asimov, Foundation est la chronique de l'extraordinaire voyage d'une bande d'exilés pour sauver l'humanité et reconstruire la civilisation pendant la chute de l'Empire galactique.	/nqhGPPerHh7mmvToi0Vd7htQjUB.jpg	/vmNj8bthBAofXgsaY6yP4bCvXko.jpg	2021-09-23	[10765, 18]		vf	hd	tv	77	t	2025-09-20 04:23:51.863371	2025-09-20 04:23:51.863371		
a15c9d6c-23c7-4378-a707-bcb9ce7c68c3	93405	Squid Game	Tentés par un prix alléchant en cas de victoire, des centaines de joueurs désargentés acceptent de s'affronter lors de jeux pour enfants aux enjeux mortels.	/heV89pC6pv5fz1plikfyQxYuE4L.jpg	/2meX1nMdScFOoV4370rqHWKmXhY.jpg	2021-09-17	[10759, 9648, 18]		vf	hd	tv	79	t	2025-09-20 04:23:51.926733	2025-09-20 04:23:51.926733		
f1299cbd-dccd-4485-9ceb-63b7b95aa3d5	18165	Vampire Diaries	Quatre mois après le tragique accident de voiture qui a tué leurs parents, Elena Gilbert, 17 ans, et son frère Jeremy, 15 ans, essaient encore de s'adapter à cette nouvelle réalité. Belle et populaire, l'adolescente poursuit ses études au Mystic Falls High en s'efforçant de masquer son chagrin. Elena est immédiatement fascinée par Stefan et Damon Salvatore, deux frères que tout oppose. Elle ne tarde pas à découvrir qu'ils sont en fait des vampires...	/4RHhqEdI2VV5wHp0rLmKAg9t9h6.jpg	/cJYLon9ejKJV7ua03ab8Tj9u067.jpg	2009-09-10	[18, 10765]		vf	hd	tv	83	t	2025-09-20 04:23:53.586681	2025-09-20 04:23:53.586681		
f8f71b11-7877-4a12-9748-edd43ec6554f	615	Futurama	Accidentellement cryogénisé le 31 décembre 1999 alors qu'il livrait une pizza, Fry se réveille 1.000 ans plus tard à New York. À l'aube de l'an 3000, le monde a bien changé, peuplé de robots et d'extraterrestres. Le jeune homme retrouve l'un de ses descendants qui l'engage lui et ses nouveaux amis, Leela et Bender, au Planet Express, une entreprise de livraison. Ensemble, ils vont devoir faire face à de périlleuses et délirantes missions dans un monde des plus surprenants.	/6ZS8SOno6kTmWz4eQ8lX8EBXOMv.jpg	/4xKG4S1IyLIglHbCYGJDsptgQNh.jpg	1999-03-28	[16, 35, 10765]		vf	hd	tv	84	t	2025-09-20 04:23:53.705956	2025-09-20 04:23:53.705956		
201eef40-a993-446e-a560-be6e42b93f2b	124364	FROM	Découvrez le mystère d'une ville cauchemardesque dans le centre des États-Unis qui piège tous ceux qui y entrent. Alors que les habitants réticents se battent pour garder un sentiment de normalité et cherchent une issue, ils doivent également survivre aux menaces de la forêt environnante, y compris les créatures terrifiantes qui sortent lorsque le soleil se couche.	/cjXLrg4R7FRPFafvuQ3SSznQOd9.jpg	/6gN8DYnIEln8v7OhRy61c57w0Xy.jpg	2022-02-20	[9648, 18, 10765]		vf	hd	tv	82	t	2025-09-20 04:23:53.779851	2025-09-20 04:23:53.779851		
5a6f74c6-19fa-4e53-b04d-1cdbe3280cc4	112726	Marvel's Storyboards	Follow Marvel’s Joe Quesada as he drops in on famous storytellers from all walks of life to talk personal origin stories and what drives their passion for storytelling.	/eRXfqxy6xXANWgmblOaAczCqVVZ.jpg	/fpgxwDFCykUTzue0hCT8VFnjVkW.jpg	2020-07-23	[]		vf	hd	tv	70	t	2025-09-20 14:14:18.680675	2025-09-20 14:14:18.680675		
05a874e2-1ab0-4351-a6ca-2cb48be226a8	71790	S.W.A.T.	Un lieutenant du S.W.A.T est tiraillé entre sa loyauté envers ses origines modestes, dont ses amis de la rue avec qui il a grandi et qui n'ont pas aussi bien tourné que lui, et son devoir envers ses co-équipiers. Une dualité qui finit par prendre tout son sens lorsqu'il se voit chargé d'organiser une unité hautement qualifiée pour résoudre les crimes à Los Angeles.	/tFYMNXnUGI2EAV6BWHS7MyR8dX0.jpg	/7j4ug9B6JXVeh5HhQjjPScrdj4Z.jpg	2017-11-02	[80, 10759, 18]		vf	hd	tv	81	t	2025-09-20 04:23:53.837083	2025-09-20 04:23:53.837083		
9a5aa8f7-2a42-46e1-a572-c3ec3d10e1de	63174	Lucifer	Lassé d’être le Seigneur des Enfers, le diable s’installe à Los Angeles où il ouvre une boîte de nuit et se lie avec une policière de la brigade criminelle...	/tU34L2zd8sWxypSxAwg01mksLdq.jpg	/ncftkNAjIz2PBbUMY7T0CHVJP8d.jpg	2016-01-25	[80, 10765]		vf	hd	tv	84	t	2025-09-20 04:23:53.92882	2025-09-20 04:23:53.92882		
d3e68db1-0455-4aed-87ee-0d888f107f6a	2691	Mon oncle Charlie	La vie d'un riche célibataire est bouleversée lorsque son frère divorcé et son neveu de dix ans débarquent dans sa propriété de Malibu. Malgré leurs différences, les deux frères décident de cohabiter pour offrir un foyer au jeune Jake.	/oD1JuejHVuDfq5qSOGmBO5OlGEo.jpg	/coHpOy9OJyFiHWeH36cSHMpLUHC.jpg	2003-09-22	[35]		vf	hd	tv	74	t	2025-09-20 04:23:54.018015	2025-09-20 04:23:54.018015		
403a67d4-aa78-4090-b446-5a6f3a0323d2	1668	Friends	Les péripéties de 6 jeunes newyorkais liés par une profonde amitié. Entre amour, travail, famille, ils partagent leurs bonheurs et leurs soucis au Central Perk, leur café favori...	/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg	/l0qVZIpXtIo7km9u5Yqh0nKPOr5.jpg	1994-09-22	[35]		vf	hd	tv	84	t	2025-09-20 04:23:54.092672	2025-09-20 04:23:54.092672		
7ffa8f77-c243-4586-b638-6cebc500cfa6	66732	Stranger Things	Quand un jeune garçon disparaît, une petite ville découvre une affaire mystérieuse, des expériences secrètes, des forces surnaturelles terrifiantes... et une fillette.	/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg	/56v2KjBlU4XaOv9rVYEQypROD7P.jpg	2016-07-15	[18, 10765, 9648]		vf	hd	tv	86	t	2025-09-20 04:23:54.152357	2025-09-20 04:23:54.152357		
f7c9d0b2-5efb-4a17-b88c-2987c1b18e00	210865	Yalı Çapkını		/pnNhlrOdgVsgNEcyKkCqv4EI1t.jpg	/vDqCoaMU5FUAuUs0EvL4OAUCxJk.jpg	2022-09-23	[10751, 18]		vf	hd	tv	83	t	2025-09-20 04:23:54.237739	2025-09-20 04:23:54.237739		
3ea5fad0-43aa-4ec2-a695-455f254c1f20	228305	Task	Dans la périphérie industrielle de Philadelphie, un agent du FBI supervise une équipe spéciale dont la mission est d'éradiquer une succession de cambriolages orchestrés par un père de famille insoupçonnable.	/mDpbYGDRx98OXlXyPJMtGftQJaS.jpg	/hEE8TV5jLQZQnpPN4QmYZ1lCJNq.jpg	2025-09-07	[80, 18]		vf	hd	tv	52	t	2025-09-20 04:23:54.302762	2025-09-20 04:23:54.302762		
16d76592-5621-4780-b1a3-38792dbc831e	1419	Castle	Richard Castle est un écrivain à succès spécialisé dans les thrillers. La police s'intéresse de près à lui lorsqu'un tueur copie les meurtres mis en scène dans ses romans. Une fois cette affaire résolue, Castle devient consultant pour la police de New York...	/irQElqVbeEGL43ukWSFnkk8UwIR.jpg	/zOnLMRD3PIhwO5KZmWMVEnLokMo.jpg	2009-03-09	[18, 80]		vf	hd	tv	80	t	2025-09-20 04:23:54.368842	2025-09-20 04:23:54.368842		
68b14469-9a32-49aa-a6d4-17975c2723a4	873	Columbo	Le lieutenant Columbo est le policier le plus célèbre de la police criminelle de Los Angeles.\n\nDans Columbo, les assassins sont des citoyens aisés, voire fortunés. Ils ne sont pas à un assassinat près et n'ont que faire d'un petit fonctionnaire de la police locale qu'ils perçoivent sans grande estime. Un policier qui n' a rien en commun avec ces confrères, il est vêtu d'habits modestes et fatigués, d'un imperméable froissé, roulant dans une veille Peugeot 403 délabrée. Il ne porte pas d'arme, s'exprime toujours avec une grande courtoisie et prête un grand intérêt aux observations et analyses des moindres détails. Ces assassins se croient à l'abri, dégainant un alibi préparé et assurés d'avoir commis le crime parfait retournent à leur vie quotidienne. Mais Columbo n'a pas son pareil pour harceler d'une dernière question, les pousser à bout pour qu'ils commenttent une erreur. Un véritable jeu du chat et de la souris s'engage entre Columbo et les suspects.	/2JCD8vab3fircOU8cM2HJCxfv4I.jpg	/2emkZBBiZG7pE7RBuIWtbKZ2a33.jpg	1971-09-15	[80, 18]		vf	hd	tv	81	t	2025-09-20 04:23:54.433485	2025-09-20 04:23:54.433485		
b0e2c984-2480-48b0-9e32-474e13ca2f71	223326	Tempest	Un candidat à la présidence est assassiné. L’ex-ambassadrice Seo Munju creuse alors dans son passé, révélant une conspiration internationale impliquant nations belliqueuses et agences de sécurité, ainsi que des renseignements secrets menaçant la stabilité de la péninsule coréenne. Alors que sa vie est en danger, elle reçoit l’aide d’un mystérieux mercenaire appelé Paik Sanho. Mais Munju peut-elle faire confiance à cet inconnu ?	/A2wLUIQ1V8dTLlhz7TwwTM84Ak.jpg	/wyCQovekJ10HnmqCE3lPNaoGDde.jpg	2025-09-10	[18, 9648]		vf	hd	tv	85	t	2025-09-20 04:23:54.547566	2025-09-20 04:23:54.547566		
e42e887a-a63e-42f3-949b-142b0d1f7e56	256721	Gachiakuta	Dans une ville flottante où les riches se débarrassent de leurs déchets, comme de leurs habitants indésirables, Rudo est accusé de meurtre et jeté dans la Fosse où vivent des créatures mutantes. Pour survivre, il doit révéler un nouveau pouvoir et rejoindre les Nettoyeurs. Rudo ne cherche pas seulement à combattre les monstres, mais aussi les personnes corrompues qui l'ont jeté dans cet enfer.	/RxuL7KuFoOzHC0htjtLGxJEGGx.jpg	/mrapJp0qb6Fvo3IW9IrjCK9IgSo.jpg	2025-07-06	[16, 10759, 18, 10765]		vf	hd	tv	90	t	2025-09-20 04:23:54.832947	2025-09-20 04:23:54.832947		
b68ad9d9-530e-4121-9d19-ca5767df0785	1402	The Walking Dead	Après une apocalypse, ayant transformé la quasi-totalité de la population en zombies, un groupe d'hommes et de femmes, mené par le shérif adjoint Rick Grimes, tente de survivre… Ensemble, ils vont devoir, tant bien que mal, faire face à ce nouveau monde, devenu méconnaissable, à travers leur périple dans le Sud profond des États-Unis.	/uW4PGpqXZNVyMkUK4dY4vKTBV2D.jpg	/rAOjnEFTuNysY7bot8zonhImGMh.jpg	2010-10-31	[10759, 18, 10765]		vf	hd	tv	81	t	2025-09-20 04:23:55.250589	2025-09-20 04:23:55.250589		
2b433c01-8951-418f-83d4-c04ddb47bfaa	207332	Sakamoto Days	Par amour, le meilleur des tueurs à gages, Taro Sakamoto, a pris sa retraite. Mais quand son passé le rattrape, il doit se battre pour protéger sa famille adorée.	/lRNXHxuOVO9TWIs98IOHTjY8XN7.jpg	/blSthAPRbEOJBowdxppeQqNPRh9.jpg	2025-01-11	[16, 35, 10759]		vf	hd	tv	81	t	2025-09-20 04:23:55.451067	2025-09-20 04:23:55.451067		
68ef8f2d-c9db-47a0-b793-7096c9c023d9	693	Desperate Housewives	Wisteria Lane est un lieu paisible où les habitants semblent mener une vie heureuse... en apparence seulement ! Car en y regardant de plus près, on découvre bien vite, dans l'intimité de chacun, que le bonheur n'est pas toujours au rendez-vous. Et peu à peu, les secrets remontent inévitablement à la surface, risquant de faire voler en éclat le vernis lisse de leur tranquille existence...	/sywYmV9c9Vj2U7ocqNyfDt2pz3r.jpg	/hW9NOFs8xUevb90KQYHhbifp9Po.jpg	2004-10-03	[9648, 18, 35]		vf	hd	tv	79	t	2025-09-20 04:23:55.526439	2025-09-20 04:23:55.526439		
d3895912-389b-43dd-b142-5d84640413a9	60585	Bosch	Harry Bosch est un détective aux homicides à Los Angeles. Bien qu’il ait été lavé de tout soupçon par les forces de l’ordre, il est toujours en procès, accusé d’avoir tué de sang-froid un potentiel tueur. Malgré cette affaire, qui s'avère médiatique, Harry refuse de s’éloigner de son travail et enquête sur des ossements qui viennent d’être retrouvés.	/vHv87Zx0EbNS8sxDunItqeqBXOD.jpg	/23S5oKZjlXehjNLEhMQuxjwbyuA.jpg	2015-01-14	[9648, 18, 80]		vf	hd	tv	79	t	2025-09-20 04:23:55.594089	2025-09-20 04:23:55.594089		
b1858230-cbc9-453a-aab6-c29793622a81	2316	The Office	Le quotidien d'un groupe d'employés de bureau dans une fabrique de papier en Pennsylvanie. Michael Scott, le responsable régional, pense être le mec le plus drôle du bureau. Il ne se doute pas que ses employés le tolèrent uniquement parce que c'est lui qui signe les chèques. S'efforçant de paraître cool et apprécié de tous, Michael est en fait perçu comme étant pathétique…	/2dApsoX4bd98szjrbj5i3syYOh2.jpg	/bX6Sypdpk0r8YFdVPoc3yeyvSmm.jpg	2005-03-24	[35]		vf	hd	tv	86	t	2025-09-20 04:23:55.665235	2025-09-20 04:23:55.665235		
95e81cc5-0357-436a-9bac-c20bf1838f14	60735	Flash	Jeune expert de la police scientifique de Central City, Barry Allen se retrouve doté d&amp;amp;amp;#x27;une vitesse extraordinaire après avoir été frappé par la foudre. Sous le costume de Flash, il utilise ses nouveaux pouvoirs pour combattre le crime.	&amp;amp;amp;#x2F;Hrta0iq8KEQbdOpSnki2gUMowk.jpg	&amp;amp;amp;#x2F;gFkHcIh7iE5G0oVOgpmY8ONQjhl.jpg	\N	[]	https://youtu.be/4E96OQlbMnw?si=QdyKd6o21G7ylq7t	vf	hd	tv	\N	f	2025-09-18 17:47:33.080899	2025-09-20 04:28:09.1	\N	\N
a390bc90-835d-4595-8455-f61d4392c6db	-1	superman					["Animation", "Action", "Fantastique", "Thriller"]		vf	hd	movie	\N	t	2025-09-20 04:39:02.118361	2025-09-20 04:39:02.118361	\N	\N
85e5462d-6f4d-41be-845a-52004e04cfb5	975419	Marvel	The quintessential student film of 1969.	/p6XFjLX7XDnAMCczOBCevVaZpFv.jpg	\N	1969-05-20	[]		vf	hd	movie	67	t	2025-09-20 14:14:09.92741	2025-09-20 14:14:09.92741		
bc29aaff-dee9-4c83-9995-54be097657e6	1396892	marvel		/swLm0uKtoUIUbPTisceO93EutfO.jpg	\N		[]		vf	hd	movie	50	t	2025-09-20 14:14:10.054401	2025-09-20 14:14:10.054401		
d0fa929a-00b1-412a-a452-78dd37eff0e2	787923	Marvel : Derrière le masque	Le documentaire donne la parole aux créateurs de bandes dessinées et à des experts de la pop culture pour évoquer le lien entre les super-héros et les fans/lecteurs.	/yJ0HpAYWvCtwEv3orgcmXvQlqsH.jpg	/69GY219MYBurtf8joA2okEa3x8I.jpg	2021-02-12	[99]		vf	hd	movie	70	t	2025-09-20 14:14:10.163706	2025-09-20 14:14:10.163706		
9fd7cea1-b320-4ad7-a163-1eae0bb23926	979160	Le guide complet Miss Marvel	Un court métrage documentaire qui vous donne un aperçu exclusif de la série originale "Ms. Marvel", de ses origines en bande dessinée à son développement et sa production en tant que prochaine série à succès de Marvel Studios sur Disney+. Il présente des entretiens avec son équipe de tournage primée et la star captivante de la série, la nouvelle venue Iman Vellani.	/j9eolvgB0wIPeXZ5Q3wkgsf9Byz.jpg	/709oX5ro1SON6OkaVnA8MOx1WSK.jpg	2022-06-01	[99]		vf	hd	movie	70	t	2025-09-20 14:14:10.272683	2025-09-20 14:14:10.272683		
d3c6bb37-c36f-4836-a78b-e3b92dd2b97d	1359227	LEGO Marvel Avengers : Mission Démolition	Un jeune héros, fan des Avengers, libère par inadvertance un nouveau méchant surpuissant qui cherche à débarrasser le monde des super-héros. Iron Man et les Avengers sont toujours là pour arrêter les vilains, mais la lutte contre les méchants peut faire de gros dégâts. C'est là qu'intervient le Damage Control dont la mission est de tout nettoyer. Mais un jour pas comme les autres, un nouveau super-vilain élabore un plan pour anéantir les Avengers et l’avenir du monde repose maintenant sur les épaules du plus improbable des héros : Dennis, un jeune employé maladroit du Damage Control. Dennis a la mauvaise habitude de détruire tout ce qu'il touche. Peut-il devenir le héros qu'il a toujours rêvé d'être et sauver les plus grands héros de la planète ?	/z8J1aTL8oDdp9bFcrXEFxAUY14B.jpg	/Al127H6f1RXpESdg0MGNL2g8mzO.jpg	2024-10-17	[16, 35, 878]		vf	hd	movie	65	t	2025-09-20 14:14:10.380698	2025-09-20 14:14:10.380698		
1b960a6d-5de3-4089-9112-af1df9cda952	1235525	MARVEL STUDIOS RASSEMBLEMENT : le making-of de The Marvels	Embarquez dans un voyage intergalactique avec l'équipe de The Marvels, qui vous dévoile les coulisses du film. Rencontrez les différents départements de production et découvrez comment les équipes techniques ont imaginé les scènes de combat, les innombrables looks extraterrestres et les décors élaborés. Entre séances de danse et journées chatons, l'équipe a vécu des moments inoubliables.	/j4aPpKs6l1dN7zucqNUXEqsgOAJ.jpg	/A38W3yyJQtKpL229vbZfsJoLX3X.jpg	2024-02-06	[99]		vf	hd	movie	55	t	2025-09-20 14:14:10.488403	2025-09-20 14:14:10.488403		
a5a925f7-653b-42cf-8ff5-9d91089709a5	576743	Marvel Rising : Chasse aux fantômes	Sur les traces de Sheath et Exile, Ghost-Spider fait équipe avec le reste des Secret Warriors pour vaincre les méchants pour de bon.	/efZ6MT5utvR4eznDyJXLKqWbi7a.jpg	/tMOWRvHc7sdsc7UNtK6Nfb0onWD.jpg	2019-01-16	[10751, 16, 28, 12]		vf	hd	movie	65	t	2025-09-20 14:14:10.597261	2025-09-20 14:14:10.597261		
ee09ce6f-3f3e-41b9-b478-4b137b547c4f	368304	LEGO Marvel Super Heroes : Avengers, tous ensemble !	Tandis que les Avengers (composés de Captain America, Thor, Iron Man, Hulk, la Veuve noire, Œil-de-Faucon et la Vision) se préparent pour une fête dans la tour des Avengers, Captain America remarque qu'Iron Man s'est comporté étrangement durant la préparation de la fête. Après avoir mené leur enquête, les Avengers découvrent qu'Ultron a pris le contrôle de l'armure d'Iron Man avec l'aide de Yellowjacket et prévoit de conquérir le monde.	/xUBZNoY7idPfqKZepnDEv7Qc8GC.jpg	/rGGRv7XXpDBVGD2BtbKWENfZOkf.jpg	2015-11-16	[10751, 16]		vf	hd	movie	66	t	2025-09-20 14:14:10.70532	2025-09-20 14:14:10.70532		
c7375e98-457b-4104-847e-aaa685641b47	592687	Marvel Rising : L'affrontement	Marvel Rising: Battle of the Bands met en vedette Dove Cameron («Descendants 3») dans le rôle de Ghost-Spider. Le jour du concours «Battle of the Bands» de Gwen, des attaques mystérieuses l'obligent, elle et les Secret Warriors, à enquêter. Peuvent-ils sauver la ville et amener Gwen au concert à temps ?	/5yjoJfCUxDgq1hpJhavoloT26dX.jpg	/ldKHOauVsqudHNbFpOczmrWA146.jpg	2019-08-28	[10751, 16, 28, 35, 878]		vf	hd	movie	62	t	2025-09-20 14:14:10.814459	2025-09-20 14:14:10.814459		
2e6e76cb-05d8-4cde-8523-bdf1799066ff	259910	Marvel : La naissance d'un univers	Dans ce documentaire exclusif, vous allez plonger au cœur de l'univers cinématographique Marvel. Découvrir les débuts des studios Marvel, depuis les films qui battent tous les records, en passant par le phénomène culturel, jusqu'à l'expansion de l'univers avec Marvel Television. Ce premier documentaire télévisé Marvel nous raconte l'histoire incroyable qui se cache derrière les studios Marvel, avec des interviews exclusives et les coulisses des films Marvel, des Éditions uniques Marvel et de Marvel : Les Agents du SHIELD. Ils vont ainsi pouvoir avoir un aperçu du futur de Marvel : les Agents du SHIELD, visionner des extraits des prochains films des studios Marvel, Captain America : Le Soldat de l'hiver et Les Gardiens de la Galaxie, et voir en exclusivité mondiale les premières images d'Avengers : L'Ère d'Ultron.	/8RzzlOpfS7eNWQYma8U738pMcoV.jpg	/2l9yXhNtLC5SHa81m3MtLfpoXTr.jpg	2014-03-18	[99, 10770, 14]		vf	hd	movie	69	t	2025-09-20 14:14:10.925689	2025-09-20 14:14:10.925689		
da8901f9-d183-49c9-9b9f-88c3593657ca	509080	LEGO Marvel Super Heroes – Gardiens de la Galaxie - La menace de Thanos	La pierre de construction est un artefact qui permet à son porteur de construire n'importe quelle arme. Après que Yondu et les Ravageurs l'aient volé à Ronan l'Accusateur pendant que lui et Nébuleuse le volaient pour Thanos, les Gardiens de la Galaxie rivalisent avec les Ravageurs et Ronan l'Accusateur pour réclamer la Pierre de Construction et la livrer aux Avengers.	/e5h1RlnQzjgEAh4s96k50S8XkKa.jpg	/hkllv8JmO3UuRNKSiIfks5plhgi.jpg	2017-12-09	[16, 10751, 878]		vf	hd	movie	66	t	2025-09-20 14:14:11.033857	2025-09-20 14:14:11.033857		
c3aae711-ee5b-4895-a376-e81eab9f4699	372631	Marvel Super Heroes - Les Gladiateurs de la glace	Le funeste Loki et Ymir le géant des glaces veulent voler les pouvoirs du père Noël. Les Avengers pourront-ils le retrouver et le protéger avant que Noël ne soit anéanti pour toujours ?	/h7pgMFwnx2dhSZypbBYdoVCV1eT.jpg	/plHcWnFZL3nHvlP9PUVUeSSv0n0.jpg	2015-12-15	[16, 14]		vf	hd	movie	60	t	2025-09-20 14:14:11.141543	2025-09-20 14:14:11.141543		
7c9cd708-5722-4e86-be52-867b2bc991ee	528222	LEGO Marvel Super Héros – Black Panther : Dangers au Wakanda	Quand Thanos commence à menacer la Terre, Black Panther entre en action. Malheureusement, son dévouement cause des problèmes à son pays le Wakanda…	/auiRFbbnMhnclaIMNGcQg0Uba8Y.jpg	/96ANeIgnKUqrBNlG2ZdesuOsony.jpg	2018-06-04	[16, 14, 10751]		vf	hd	movie	59	t	2025-09-20 14:14:11.251365	2025-09-20 14:14:11.251365		
aaae0cfb-22bf-496e-b9b4-55607e8520d9	1154598	LEGO Marvel Avengers: Code Rouge	Les Avengers se rassemblent pour sauver New York, mais lorsque Black Widow reproche à son père la façon dont il l’a élevée, ce dernier disparait mystérieusement. Alors que les Avengers enquêtent, ils découvrent que le méchant Collectionneur kidnappe ceux dont le nom fait référence au mot « rouge ». Déterminée à retrouver son père, c'est maintenant à Black Widow de conduire les Avengers à la recherche du repaire du maléfique Collectionneur et de libérer les prisonniers de ses griffes fatales.	/zccXTcrsWtOO4dKpCEMiWqFG6Xk.jpg	/oFSQEG1lJTTISj3QKB7cJ9ANkFw.jpg	2023-10-26	[16, 28, 10751]		vf	hd	movie	64	t	2025-09-20 14:14:11.359142	2025-09-20 14:14:11.359142		
11831145-d5d7-42bc-a01d-8c10c33cb3e9	583209	Marvel Rising : Cœur de Fer	Ironheart, alias Riri Williams, a du mal à s'adapter à la vie universitaire en tant que plus jeune étudiante là-bas lorsque le laboratoire d'ingénierie du collège est démoli par un extraterrestre et que sa meilleure amie est kidnappée. Inspirée par Iron Man, elle élabore un plan pour sauver son ami.	/vyJTfBQkuPAiQdZ1ozgNKwiifB7.jpg	/2xYx2KU8KfqaI7efAmJgbZFzPWO.jpg	2019-04-03	[16, 10751, 878, 28]		vf	hd	movie	65	t	2025-09-20 14:14:11.470575	2025-09-20 14:14:11.470575		
ec79841f-2bce-422f-9e58-60442d9c18f5	592689	Marvel Rising : Jouer avec le feu	Les pouvoirs d'Inferno sont volés par un jeune et puissant méchant et c'est aux Secret Warriors de vaincre leur nouvel ennemi et d'aider leur ami. Mais Inferno VEUT-il vraiment récupérer ses pouvoirs ? Pendant ce temps, America Chavez apprend une leçon sur l'amitié et la famille auprès de sa coéquipière Ms Marvel.	/lelNkBnjIi4N1uQBV2TnODgS9UT.jpg	/h6CDPPYv5ir8mEG6kRtgwnjCmlk.jpg	2019-12-18	[16, 28, 12, 10751]		vf	hd	movie	62	t	2025-09-20 14:14:11.577957	2025-09-20 14:14:11.577957		
a9cd3056-341b-4b12-bbbf-d18119b465ff	284019	Phinéas et Ferb : Mission Marvel	Spider-Man, Iron Man, Thor et Hulk entrent à Danville après que la machine à voyager dans les dimensions du Dr Doofenshmirtz crée un problème dans l’espace, ce qui supprime accidentellement leurs pouvoirs et les rendent humains. Phinéas et Ferb vont devoir les aider pour que leurs pouvoirs reviennent et qu'ils combattent Crâne rouge, Blacklash, Venom et MODOK.	/zN8NICgy35VDTIkE4Q6Q7YyTFYQ.jpg	/cmQdrAsmZomfAl3v7WurDvZM7UK.jpg	2013-08-16	[16, 10751, 35, 10770, 28, 12, 878, 10402]		vf	hd	movie	65	t	2025-09-20 14:14:11.686053	2025-09-20 14:14:11.686053		
10adcabc-34cf-4cbe-974c-8bbdeaf1946d	964943	Marvel Studios Rassemblement - Le Making-of de Moon Knight	Joignez-vous à Oscar Isaac et Ethan Hawke alors qu'ils révèlent comment la série des Studios Marvel, Moon Knight, a été minutieusement créée. Marvel Studios Rassemblement vous ouvre les portes de cette série révolutionnaire grâce à des interviews de l'équipe et des extraits de tournage. De plus, le Making-of de Moon Knight inclut une conversation sans détour en compagnie des réalisateurs de la série.	/g2ifCoutSEnTQ6R0Qn2nkDIxlXb.jpg	/na17QbhoGqwM1X5an2uRA8k94eG.jpg	2022-05-24	[99]		vf	hd	movie	70	t	2025-09-20 14:14:11.793936	2025-09-20 14:14:11.793936		
f83b1d9e-b5b1-4b4c-828f-11da56a2d53d	299969	Marvel : 75 ans, du papier au monde entier	Les origines de Marvel, depuis ses débuts en 1939 sous le nom de Timely Comics. Martin Goodman et Stan Lee se présentent comme des figures marquantes de l’histoire de Marvel dans les années 40, et la création de Captain America devient un moment charnière, avec le choc de la Seconde Guerre mondiale, le déclin des histoires de super-héros et la chute du milieu de la bande dessinée dans les années 1950. Après une décennie de déclin, Stan Lee et Jack Kirby ont créé en 1961 l’équipe de super-héros modernes des Quatre Fantastiques, contribuant à relancer les histoires de super-héros et ouvrant la voie à « l’Ère Marvel ».	/oJBBjm8qKr1jO9lMhEMyqkZy8gJ.jpg	/69rb6VKOEqpuJ88MkKXLaSd71Va.jpg	2014-11-04	[99]		vf	hd	movie	69	t	2025-09-20 14:14:11.905123	2025-09-20 14:14:11.905123		
b0adc2c7-f3e7-4287-9838-85f570b553a1	630676	Nous avons fait Marvel R-Rated	Et si le MCU était R-Rated ?	\N	\N	2019-08-08	[]		vf	hd	movie	100	t	2025-09-20 14:14:12.015316	2025-09-20 14:14:12.015316		
d93306eb-76de-4d08-a8de-4e53fe2f6379	763861	LEGO Marvel Super Heroes : contrôle maximum	Spider-Man et les super-héros de Marvel affrontent un Loki espiègle et une équipe de super-vilains dans une toute nouvelle aventure LEGO	/ry0N6rxZCuhCPUJRSzF8l3gcwqY.jpg	/g6517HyIuqqB8go3A3DzktjVyLF.jpg	2013-11-05	[16, 28, 35]		vf	hd	movie	63	t	2025-09-20 14:14:12.486438	2025-09-20 14:14:12.486438		
0cce8493-d485-42a6-b4a0-00bcbb99f3cc	1001912	Marvel Studios Rassemblement - Le Making-of de Miss Marvel	Cet épisode de Marvel Studios Rassemblement nous emmène sur le chemin de la concrétisation d'un phénomène mondial très attendu. Découvrez les coulisses à chaque étape du processus de création grâce à des séquences immersives du tournage de la série, ainsi que des interviews perspicaces des acteurs et de l'équipe de Miss Marvel sur le plateau, alors que nous observons Iman Vellani et son personnage, Kamala Khan, devenir sous nos yeux la super-héroïne préférée des fans.	/nzOCM7t6UoRuC7Le1XJCB42Nd2M.jpg	/5LBajgZwqS9plL5MDtIfmlFatSz.jpg	2022-08-03	[99]		vf	hd	movie	70	t	2025-09-20 14:14:12.59554	2025-09-20 14:14:12.59554		
e1ab62ce-e4a9-4982-9f6b-4fd099c821ca	877188	Le Disney+ Day des studios Marvel	Explorez les séries Disney+ du MCU : passées, présentes et futures.	/TaVR1R2kXDcAhBDnzj0SJlSFF3.jpg	/rLnv5QXUE3ITZTfrobsfXuAUtG.jpg	2021-11-12	[99]		vf	hd	movie	69	t	2025-09-20 14:14:12.705207	2025-09-20 14:14:12.705207		
a9937320-8aa7-41b1-b34e-3995b2e613c8	57083	Marvel Mash-Up	The Marvel Universe is turned upside down with these humorous and unexpected takes on iconic Marvel heroes and villains - featuring classic animation with new voices and editing.	/wZapLZXNoGczQlvQbfD5Mj13Nbs.jpg	/nAw1JhtzcD4b6qgwWNNgxYQCgBI.jpg	2012-04-01	[]		vf	hd	tv	75	t	2025-09-20 14:14:23.560642	2025-09-20 14:14:23.560642		
1890b295-35d4-4ff1-86f9-6cdd91fcba4d	609681	The Marvels	Carol Danvers, alias Captain Marvel, a récupéré son identité auprès du tyrannique Kree et s'est vengée du renseignement suprême. Cependant, des conséquences inattendues la voient assumer le fardeau d'un univers déstabilisé. Lorsque ses fonctions l'envoient dans un trou de ver anormal lié à un révolutionnaire Kree, ses pouvoirs s'entremêlent avec deux autres superhéros pour former les Marvels.	/mqAQO6j5gkq6iwCXNbXpzf0RXBU.jpg	/criPrxkTggCra1jch49jsiSeXo1.jpg	2023-11-08	[878, 12, 28]		vf	hd	movie	60	t	2025-09-20 14:14:12.8157	2025-09-20 14:14:12.8157		
a5b22646-a473-4183-a4e0-1f091617e13a	1026208	Le Making-of de She-Hulk : Avocate	Rejoignez Tatiana Maslany, Mark Ruffalo, Tim Roth et Benedict Wong dans les coulisses du tournage de la série She-Hulk : Avocate. Découvrez ce qu'il a fallu aux créateurs de She-Hulk pour adopter le ton délicat de la série et livrer la première série vraiment comique de Marvel Studios - une série qui brise audacieusement le quatrième mur pour parler à son propre public, rien de moins !	/nqUqXNmW23RpxbYaXgpJanGuHmT.jpg	/kjkKMfpF87C8qcRL3c6sNJ8J83y.jpg	2022-11-03	[99]		vf	hd	movie	69	t	2025-09-20 14:14:12.925412	2025-09-20 14:14:12.925412		
f93b1517-08ae-4383-9888-8304a3fcd81f	299537	Captain Marvel	Captain Marvel raconte l’histoire de Carol Danvers qui va devenir l’une des super-héroïnes les plus puissantes de l’univers lorsque la Terre se révèle l’enjeu d’une guerre galactique entre deux races extraterrestres.	/3v6dxV5l6Zs2OcrAnIcuE9POeGY.jpg	/qAzYK4YPSWDc7aa4R43LcwRIAyb.jpg	2019-03-06	[28, 12, 878]		vf	hd	movie	68	t	2025-09-20 14:14:13.034414	2025-09-20 14:14:13.034414		
e75316d7-3701-4e16-bb5d-e850e2485b3e	861183	Alien Artifacts: Pyramids, Monoliths and Marvels	Le mystère des pyramides et autres découvertes et artefacts archéologiques est plus déconcertant que jamais alors que les progrès technologiques avec le lidar, les drones, la tomographie et bien plus encore révèlent des révélations fracassant les paradigmes sur des civilisations anciennes très avancées à un niveau sans précédent. Des informations étonnantes sur les mathématiques et l'ingénierie rendent les preuves plus époustouflantes que jamais. Explorez le monde antique et découvrez les découvertes récentes qui déconcertent les scientifiques et les archéologues.	/fRjRof41KxnxOIdkFqxrJMsVHa0.jpg	/GXOUdcy9ln4RclHDvYD8Bz9YKu.jpg	2021-07-09	[99]		vf	hd	movie	80	t	2025-09-20 14:14:13.141811	2025-09-20 14:14:13.141811		
66f7516c-2e4e-422d-acca-d62183a5cffe	1015595	Le Making of de Thor : Love and Thunder	Installez-vous avec Taika Waititi, Chris Hemsworth, Natalie Portman, Christian Bale et Tessa Thompson, et découvrez les secrets de la création de Thor: Love and Thunder. Grâce à des entretiens approfondis avec les acteurs et l'équipe, ainsi qu'à des images inédites du plateau de tournage, le documentaire lève le rideau sur le quatrième long métrage du Dieu du tonnerre.	/ad4x6wq7Mex6xHxbgoq1grqHUDX.jpg	/3UBlm2N094EFPWuBn3v2EGtHr95.jpg	2022-09-08	[99]		vf	hd	movie	69	t	2025-09-20 14:14:13.250395	2025-09-20 14:14:13.250395		
b11d9d92-824f-4637-a8f7-45cfa0dce554	1076032	Rassemblement : le making-of de Black Panther : Wakanda Forever	Vivez la production de « Black Panther : Wakanda Forever ». Les acteurs et l'équipe relèvent l'incroyable défi de se souvenir de T'Challa, avec un chapitre digne du défunt roi. À travers des images et des interviews intimes des coulisses, suivez Shuri incarner le héros de Wakanda et affronter un nouvel ennemi des profondeurs de l'océan à Namor.	/bRvnRBE5ESyJLr95rG7k4KyHX66.jpg	/jpZNOChdKmOzf4bqkpKjOKEeT1Q.jpg	2023-02-07	[99]		vf	hd	movie	64	t	2025-09-20 14:14:13.357758	2025-09-20 14:14:13.357758		
f220c261-fc79-486b-942b-70f3302cb6f1	936643	Le Making-of de Hawkeye	Rejoignez Jeremy Renner, Hailee Steinfeld, Florence Pugh ainsi que Vincent D'Onofrio et découvrez comment la série \\"Hawkeye\\" des Studios Marvel a été conçue et réalisée. Des personnages emblématiques des comics, tels que Kate Bishop, ont été adaptés et ont pris vie à travers cette série de six épisodes.	/nQeWYPsVxbXvLryBj5l2ADF527e.jpg	/cOyxcD7YUZPriEhyCEbkJlY9kQg.jpg	2022-02-09	[99]		vf	hd	movie	71	t	2025-09-20 14:14:13.467971	2025-09-20 14:14:13.467971		
aa58d8ff-eba0-4e2a-a524-cd67c5ff6ec0	940543	LEGO Marvel Avengers: Time Twisted	Thanos s'est emparé du tunnel quantique, mais les Avengers seront prêts à tout pour l'empêcher de modifier le passé.	/7nA9AjJ8iZvbBPsFPC2FNoFj568.jpg	/fYVwmnRDCGQIpKA0QpzIEkczSes.jpg	2022-01-17	[10751, 16, 28, 12]		vf	hd	movie	69	t	2025-09-20 14:14:13.576508	2025-09-20 14:14:13.576508		
62860d8d-34e1-4873-92e3-9206819e5d8e	443985	Marvelous Stunts Of Kung Fu	The stars are cast as a gorgeous woman, a mystic and a kung-fu expert.  They team up to form a united front when an insidious empire threatens the well-being of the land they love.	/eLs9RqwkrEDFM3MhcbiPvcn95tP.jpg	\N	1979-01-01	[]		vf	hd	movie	54	t	2025-09-20 14:14:13.687518	2025-09-20 14:14:13.687518		
d7c74f7c-203e-49e5-ab6a-ec00547b6b3d	208816	Wee Sing in the Marvelous Musical Mansion	A mysterious package from Timbuktu? A door knocker that rattles off riddles? Music boxes that come to life? Piccolo Pizza and Piano Pudding? Where will you find such magical, musical, mysterious things? At Uncle Rubato’s Marvelous Musical Mansion! Dance and sing in every room with enchanting new friends and help Uncle Rubato, Aunty Annabella, Alex, Benji, and Kelly solve a most baffling mystery---who or what took all the missing musical treasures? Enjoy this wholesome entertainment for the entire family. Dazzling sets and over 20 uplifting song and dance numbers showcase adorable characters who inspire the love of music while sharing important values including self-esteem and being considerate of others.	/bHLxG2wASGGnddkjlomCUIbhD11.jpg	/nOk9oneyhV2124P3bk8qr3cQOPY.jpg	1992-09-04	[10751]		vf	hd	movie	43	t	2025-09-20 14:14:13.79581	2025-09-20 14:14:13.79581		
3fc61763-ada2-4f23-b32b-e2c14cb01d7c	1275606	Rassemblement : le making-of de X-Men '97	Au début des années 1990, la série animée X-Men arrive sur le petit écran, pour le plus grand plaisir de millions de spectateurs avides de nouveauté. Très différente des dessins animés qui l'avaient précédée, elle abordait des thèmes inhabituels, comme le racisme ou l'injustice sociale. Retrouvez les acteurs originaux, ainsi que de nouvelles voix, grâce à Rassemblement, qui revient sur la première série et sa renaissance 30 ans plus tard, avec X-Men '97.	/jPQyGA3ke7fdEmv6k0zgxa3MrFa.jpg	/dfqaWaAKbKyKFKiMyzqBzGKTnSB.jpg	2024-05-21	[99]		vf	hd	movie	59	t	2025-09-20 14:14:13.906417	2025-09-20 14:14:13.906417		
8fdfe5b0-7dd5-4039-af31-c9713bb2213f	685411	La rebelle et la magicienne	Une adolescente rebelle de 13 ans qui fait face à la perte de sa mère se lance dans une aventure avec un magicien de fêtes pour enfants.	/8ZCfN2hbZw2lnZPzO2frUqiJQ2V.jpg	/unK6POhCN6ta6l5yH8oqlRS1UJL.jpg	2022-04-22	[35, 18]		vf	hd	movie	69	t	2025-09-20 14:14:14.012126	2025-09-20 14:14:14.012126		
acccb06c-7516-43a2-af28-bb71b27b1a04	647375	Marvel Studios: Expanding the Universe	Un aperçu captivant de l'avenir des films de Marvel Studios, avec des séquences inédites présentant les talents et les réalisateurs des séries Disney+ à venir.	/dU7qXzttvOUvSlwwpEFQDsLnThK.jpg	/43NgWUj0Sr9AoM8Prv0QOWsL92k.jpg	2019-11-12	[99]		vf	hd	movie	59	t	2025-09-20 14:14:14.121987	2025-09-20 14:14:14.121987		
52c5c7d8-058a-4467-b330-6af4b61842cd	117690	Marvelous City		/AfbBuzI6X5JGw8KwSvC7pCBbrc5.jpg	/zUOf1expJBeAd07iBDXhhyAUt5y.jpg	2021-01-05	[10764]		vf	hd	tv	82	t	2025-09-20 14:14:23.670709	2025-09-20 14:14:23.670709		
d494de82-cd53-4847-a371-01b1a3500ddd	1220337	Rassemblement: Le making-of de Echo	Entrez dans les coulisses de la nouvelle série autour de Maya Lopez. Découvrez comment la production a tenu à mettre en scène un personnage sourd comme jamais auparavant et à montrer la culture amérindienne avec sincérité. Écoutez Vincent D'Onofrio parler de ses retrouvailles avec le terrible Caïd. Et bien d'autres choses vous attendent dans « Marvel Studios Rassemblement : le making-of de Echo. »	/vYAmCQ0ZbumwLJncUG8hPomb5R7.jpg	/cU8P1DeAlbAr8g9NlJony6FGIhi.jpg	2024-01-31	[99]		vf	hd	movie	59	t	2025-09-20 14:14:14.230914	2025-09-20 14:14:14.230914		
840c03cd-c0ee-49cc-a556-8d3c10e8fdcb	1017831	Marvel & DC's War on God: Doctor Strange, Aleister Crowley and the Multiverse of Satanism	What is the connection to Satanist Aleister Crowley, Satanism, the ancient heresy of Gnosticism and Doctor Strange? To truly understand the spiritual foundation of Marvel cosmology, one must first understand the influence behind many of the comic book writers. These same influences were brought into the first iterations of Doctor Strange beginning in 1961, when he was first introduced as Dr. Droom, and then Dr. Druid in 1976. Journey with us as we pull back the curtain further in Part 2 of Marvel & DC’s War on God to discover how the top movie franchises are continuing to indoctrinate and perpetuate Satanic lies to hundreds of millions of young people among their unsuspecting audience.	/6uVVFDo328yz0mfbWwB0Ntt9aTM.jpg	\N	2022-09-02	[99]		vf	hd	movie	75	t	2025-09-20 14:14:14.338865	2025-09-20 14:14:14.338865		
43222667-c316-40b1-975f-b119a3dee101	1387507	Marvel Studios Assembled: The Making of Agatha All Along	Join Kathryn Hahn, Aubrey Plaza, Joe Locke, and more as they invite viewers behind-the-scenes of Agatha All Along.	/8gJ4SkWVzFDcUfYVJDTWl85HnNU.jpg	/ef53usvUPf5VNWXpdCdSj3Bqw3Q.jpg	2024-11-13	[99]		vf	hd	movie	83	t	2025-09-20 14:14:14.448271	2025-09-20 14:14:14.448271		
9b7a2b51-4124-4dd1-a5f9-980c3608bac5	662151	Celebrating Marvel's Stan Lee	Filmed in part in front of a live audience at The New Amsterdam Theater in New York City, this Stan Lee tribute takes viewers on an action-packed journey throughout the life of Lee and across the Marvel Universe, sharing never-before-seen interviews and archive footage with Lee himself from deep within the Marvel and ABC News archives.	/8qlFNCxQQOLfnqwRcHY6WMkb7tF.jpg	/3tFuJZI6B5C9hQniPqkVZaOmTbb.jpg	2019-12-20	[99, 14]		vf	hd	movie	71	t	2025-09-20 14:14:14.558151	2025-09-20 14:14:14.558151		
021d6bac-2496-4349-8f1f-dd16739f1bc7	442308	Marvelous Mandy	Down-on-his-luck single dad Harvey Fowler gets a much needed boost when he meets children's author Mandy Simpkins, author of the Marvelous Mandy storybooks that his daughter loves. Their beautifully vivacious relationship seems like it couldn't get any more perfect, until Harvey gains some disturbing insights into her fractured mental state. When cracks start to show through her dreamlike personality, Harvey learns who she really is- and just how vicious she'll become to maintain the illusion of her perfect life.	\N	\N	2016-10-17	[14, 53]		vf	hd	movie	0	t	2025-09-20 14:14:15.054978	2025-09-20 14:14:15.054978		
8f7fdd77-3347-497c-9753-f12ea421332d	939356	Le Making-of Les Éternels	Rejoignez la réalisatrice Chloe Zhao et les acteurs du film "Les Éternels" alors qu'ils racontent leurs expériences pendant le tournage le plus ambitieux de Marvel Studios à ce jour. Découvrez comment les membres de l'équipe ont su s'imprégner de leurs rôles, et comment cela a contribué à créer des relations qui s'étendent sur plus de 7 000 ans entre les personnages.	/okFanmFdbnFQqX9YJsN2wOeueq0.jpg	/imkqp2S4ZXEGczb59ciF6IYVwnW.jpg	2022-02-16	[99]		vf	hd	movie	71	t	2025-09-20 14:14:15.163506	2025-09-20 14:14:15.163506		
8d9c506c-89d0-49d5-a187-6bb7c32178d3	350189	Marvel Then and Now: An Evening with Stan Lee and Joe Quesada	Marvel's first editor in chief, pop culture icon Stan Lee, and Marvel's current editor in chief, Joe Quesada, talk about the past and future of the company's stable of super-heroes in a lively discussion helmed by filmmaker Kevin Smith.	/3xMocdsTja2rW7lLiNBIgeu9x5c.jpg	\N	2007-03-01	[99]		vf	hd	movie	0	t	2025-09-20 14:14:15.272773	2025-09-20 14:14:15.272773		
96f1f057-fb34-4e76-a7f2-a93ddf8877c0	375211	Marvel Knights: Eternals	You are thousands of years old. You have amazing powers. You have watched civilizations rise and fall. So why does no one remember any of this? Best-selling author, Neil Gaiman (Marvel: 1602) is joined by superstar artist, John Romita. Jr. (Amazing Spider-Man), to bring you the extraordinary tale of The Eternals. Medical student Mark Curry's world is turned upside-down when he meets Ike Harris, a man who believes that he is part of a centuries-old race of super-powered beings put here on Earth by aliens to preserve and safeguard the planet — and even crazier, tried to convince Mark that he is one too.	/wVWDDzB0sWEIEMh0TXgqRa8X65o.jpg	/zRWPnVX9KL1LPOQrJfPuY9ynVkX.jpg	2014-09-16	[16]		vf	hd	movie	69	t	2025-09-20 14:14:15.376394	2025-09-20 14:14:15.376394		
19523715-a9cd-4f41-b11f-fc0b2a4697d8	1165500	Rassemblement : Le Making-of de Secret Invasion	Pendant que Nick Fury séjournait en orbite, la situation des Skrulls cachés sur Terre a échappé à tout contrôle et une guerre se prépare dans l'ombre. Une faction skrull radicale, menée par le machiavélique Gravik, s'est infiltrée partout et veut étendre sa mainmise sur le monde entier. Fury doit percer les mensonges et échapper aux pièges de l'ennemi métamorphe dans la nouvelle série Marvel, Secret Invasion. À travers des interviews de l'équipe et des acteurs, et grâce à des images exclusives, découvrez comment est né ce thriller haletant. Retrouvez des vétérans comme Cobie Smulders et Ben Mendelson, qui reviennent sur les aventures de Maria Hill et Talos, ou de nouvelles venues, Emilia Clarke et Olivia Colman, qui font leur entrée dans l'univers Marvel. Découvrez également comment une équipe d'experts en maquillage est parvenue à transformer des dizaines d'acteurs en autant de Skrulls aux traits variés.	/bL1AhghkBe4awFTE9znrz48rGKc.jpg	/h1YkKxMB1DyOgmIxTGBEQwvTogx.jpg	2023-09-19	[99]		vf	hd	movie	51	t	2025-09-20 14:14:15.491464	2025-09-20 14:14:15.491464		
a09d519a-2e55-44ac-9ef7-d00ed4e9d97b	999412	Phase 2 Tag Scenes: A Making of the Marvel Cinematic Universe Phase Two	A quick look at the post-credit sequences throughout the Marvel film universe and how they interconnect the stories from Iron Man forward, including how they are selected, filmed, and what they mean in the broader context.	\N	\N	2015-12-08	[99]		vf	hd	movie	50	t	2025-09-20 14:14:15.600969	2025-09-20 14:14:15.600969		
ae914d56-0f63-4892-8784-818a98f5b703	409409	The Marvellous World of Roald Dahl	Fighter pilot, inventor, spy - the life of Roald Dahl is often stranger than fiction. Through a vast collection of his letters, writings and archive, the story is told largely in his own words with contributions from his last wife Liccy, daughter Lucy and biographer Donald Sturrock.	\N	\N	2016-08-04	[16, 99, 10770]		vf	hd	movie	80	t	2025-09-20 14:14:15.708046	2025-09-20 14:14:15.708046		
018ba024-942e-4063-b152-fcf35895f627	491633	Marvel Rising: Secret Warriors	Marvel Rising: Secret Warriors est un événement attendu depuis longtemps, réunissant les personnages les plus récents et les plus appréciés de Marvel qui ont suscité l'enthousiasme des fans au cours des dernières années. Les adolescentes propulsées Mme Marvel, Squirrel Girl, Quake, Patriot, America Chavez et Inferno unissent leurs forces pour former un équipage improbable mais formidable de héros en herbe. Lorsqu'une menace à laquelle personne n'aurait pu s'attendre pèse sur l'univers Marvel, ce groupe d'adolescents hétéroclites et non formés n'a d'autre choix que de se lever ensemble et de prouver au monde que parfois la différence entre un "héros" et un "inadapté" est juste le nom.	/rXmc4jvDBU04Wp8r5JMWy3HbhB3.jpg	/iVAzSEm2ERu080VN2fWQG27NkdR.jpg	2018-09-30	[10751, 16, 28, 35, 878, 10770, 12]		vf	hd	movie	64	t	2025-09-20 14:14:15.819207	2025-09-20 14:14:15.819207		
a0788c48-a43b-4da7-80e7-8e68617e1063	592688	Marvel Rising: Operation Shuri	Après avoir longtemps vécu avec sa famille, Shuri, la jeune sœur de Black Panther, est prête à prendre son émancipation mais rencontre des difficultés sociales car elle a été toujours une guerrière. Elle sera alors aidée par les Secret Warriors pour devenir un simple humain.	/4fcvluN98HWo6VB7C5ONRNOL4CY.jpg	/1esYKJTQTJkavBM8xtRX33dcobw.jpg	2019-10-11	[10751, 16, 878, 12]		vf	hd	movie	59	t	2025-09-20 14:14:15.92692	2025-09-20 14:14:15.92692		
00a7b87e-af37-4aff-9647-366d4f6bc086	413589	Modern Marvels: American Steel: Built to Last	An exploration of the past and future of the steel industry in America.	\N	\N		[99]		vf	hd	movie	50	t	2025-09-20 14:14:16.035796	2025-09-20 14:14:16.035796		
ccace175-f862-4822-b7cd-0fb81c017fc2	979355	The Masked Marvels	Cook Gale Henry and butler Milton Sims are arguing in the kitchen about who would make the best detective, until the lady of the house comes in to see about the delay in dinner and fires them both. Freed from their domestic duties, they are at liberty to become detectives.	\N	\N	1917-10-01	[35]		vf	hd	movie	50	t	2025-09-20 14:14:16.145747	2025-09-20 14:14:16.145747		
96522bf2-c3ba-4afd-900e-c230cab600fa	899249	LEGO Marvel Avengers: Loki in Training	Loki souhaite devenir un Avenger, Iron Man décide alors de faire de Loki un "Avenger en formation". Tout est parfait jusqu'à ce que Thanos arrive sur Terre à la recherche de Loki.	/eyBifMbovoQbyuNXHOFYo7tsInp.jpg	/8q7wYWpD7WKl1GRBwe3svNjfxFk.jpg	2021-11-01	[10751, 16, 28]		vf	hd	movie	71	t	2025-09-20 14:14:16.254779	2025-09-20 14:14:16.254779		
a9fffe39-b80b-44bc-b78a-2092bdd5c2d0	76122	Le Consultant	L'agent du S.H.I.E.L.D. Phil Coulson rejoint l'agent Sitwell afin de discuter de la décision de faire d'Emil Blonsky/L'Abomination un membre du projet "Avengers" et des moyens de l'empêcher…	/ujamH9m90eIknBeCHPmFhFWm6kT.jpg	/r1Q3jyOpfbF3VDU52w8RzkTPbfe.jpg	2011-09-13	[12, 14, 878, 28]		vf	hd	movie	63	t	2025-09-20 14:14:16.363854	2025-09-20 14:14:16.363854		
24123f95-6f99-40a2-ac88-dee9b6e79912	252516	The Masked Marvel	A team of two-fisted insurance investigators (one of whom disguises himself as The Masked Marvel)  endeavor to discover and thwart the loathsome saboteur Sakima.	/8ynZTX3Fu74a2Rqsd8gqsA4TZRB.jpg	/tThtIlij6j09WuOqHi6ZOqYmdUs.jpg	1943-11-06	[28]		vf	hd	movie	48	t	2025-09-20 14:14:16.474416	2025-09-20 14:14:16.474416		
c8fde7ea-d7e5-42dc-a968-30971481fc04	1208005	Ultimate Spiderman Vs The Greatest Villains of Marvel		/qSY29dsYKQHj3bERXNr0n9poQSB.jpg	/vwiwNPpIDeToC3TIGJaTID8cn48.jpg		[]		vf	hd	movie	48	t	2025-09-20 14:14:16.583426	2025-09-20 14:14:16.583426		
66b236de-6435-4590-9ed9-b43b6c396510	253980	Longue vie au roi	Après les événements survenus dans "Iron Man 3", Trevor Slattery est devenu l’incarnation du mal. Le Mandarin est donc enfermé dans une prison haute sécurité. Heureusement, sa réputation le précède, ce qui lui apporte célébrité et protection à l'intérieur même de la prison. Voyant son heure de gloire enfin venue, Trevor accepte la proposition d’un réalisateur de documentaires de réendosser son profil de faux méchant…	/tbYuQj2kX7Iu2gPMMc35S5KGahv.jpg	/6bE5dA1YiTCPEWrm8fwpt5JIqDh.jpg	2014-02-04	[28, 35, 14]		vf	hd	movie	67	t	2025-09-20 14:14:16.6919	2025-09-20 14:14:16.6919		
fe01f1ce-e3f3-4d90-bec6-fe3419d94a78	164436	How to Draw Comics the Marvel Way	Superhero creator and Marvel Comics legend, Stan Lee, together with Marvel's top artist, John Buscema, demonstrate the skills needed to create compelling characters and scenes for drawing and writing comic books. Based on the book of the same name, the video became an educational classic for aspiring cartoonists and is also available on DVD. Stan Lee's flair for humor and close friendship with Buscema adds to this good-natured instructional video a sense of drama, action and fun. Stan Lee's inimitable talent for creating superheroes (Spider Man, The Incredible Hulk, etc.) and Buscema's own creations (Conan the Barbarian, Silver Surfer, etc.) meshes well in the conversation and makes this a special treat for comic book fans as well as cartoonists on all levels	/sMjKUAR9FaEWg8ZEjuenqQ2xEu3.jpg	\N	1988-07-31	[99]		vf	hd	movie	46	t	2025-09-20 14:14:16.807252	2025-09-20 14:14:16.807252		
479371f1-da43-4756-be5d-80164c283bcb	1165487	Rassemblement : Le making-of de Les Gardiens de la Galaxie Vol. 3	James Gunn, le réalisateur visionnaire, et les stars Chris Pratt et Zoe Saldaña reviennent sur la conception, le développement et la sortie des Gardiens de la Galaxie Vol. 3. Découvrez les décors gigantesques et minutieusement détaillés créés spécialement pour le film. Rencontrez les étranges créatures extraterrestres, plus nombreuses que jamais, qui peuplent cet ultime volet de la saga. Côtoyez Bradley Cooper en studio tandis qui donne vie à l'adorable Rocket. Et vivez des moments émouvants aux côtés des acteurs et de l'équipe technique du film, tandis qu'ils s'apprêtent à se dire au revoir et à clore le dernier chapitre des aventures de Peter Quill et de sa joyeuse bande d'outsiders. Tout ça et bien plus, c'est dans Rassemblement : le making-of de Les Gardiens de la Galaxie Vol. 3.	/fhbh1yaI0knADy1PMMXh1fYYwST.jpg	/7SgsIAwZRx2CW5uAgIQDwrw3KpA.jpg	2023-09-12	[99]		vf	hd	movie	65	t	2025-09-20 14:14:16.913187	2025-09-20 14:14:16.913187		
25a8f844-1cdf-4b76-b414-66448e76a461	525999	Merely Marvelous: The Dancing Genius of Gwen Verdon	Merely Marvelous is a celebration of the art and life of Broadway's greatest dancing star, Gwen Verdon. She overcame many obstacles, including rickets, the Hollywood system, a loveless first marriage and a difficult second marriage to choreographer/director Bob Fosse, to become a multi-Tony Award-winning performer. Gwen's life is told through interviews with family members and theatre associates as well as a mine of rare footage from her Broadway and Hollywood careers. Merely Marvelous is the story of a brave woman who rose to the very top of her profession.	/zuExtfwutYRjwl2y1dIUILAFOMH.jpg	/sXjrDUSpPG0OVl7JZ29xRBsGSxL.jpg	2019-08-03	[99]		vf	hd	movie	73	t	2025-09-20 14:14:17.020389	2025-09-20 14:14:17.020389		
97b772f8-f0e6-4de6-b0a8-6221f84a634b	38247	Marvel Anime : Wolverine	Les aventures de Logan, aka Wolverine, qui prend la direction du Japon pour retrouver la femme de sa vie : Mariko ! Déterminé à la sauver, il sort les griffes et ne recule devant rien pour voler au secours de sa belle, au prix de quelques sacrifices…	/wgN8YRBtof55H2Glza256kzJ300.jpg	/b4wRDmy0tqad6JC7GybUu1dzLxF.jpg	2011-01-07	[10759, 16, 10765]		vf	hd	tv	65	t	2025-09-20 14:14:20.220376	2025-09-20 14:14:20.220376		
c1bb8bc2-8015-47a7-af71-e3951de72377	72705	Marvel's Spider-Man	Centré sur les origines du super-héros, Marvel’s Spider-Man suit le jeune Peter Parker, un brillant étudiant promis à un grand avenir dont le destin est bouleversé quand il développe des super-pouvoirs après avoir été mordu par une araignée radioactive. Mais, comme chacun sait, un grand pouvoir implique de grandes responsabilités, et c’est à ses dépens - la mort de son oncle Ben - que l’adolescent va s’en rendre compte.	/dKdcyyHUR5WTMnrbPdYN5y9xPVp.jpg	/qDum1yhNftUMaIB3pPiZ7PLsIto.jpg	2017-08-19	[16, 10765, 35, 10751]		vf	hd	tv	75	t	2025-09-20 14:14:17.375636	2025-09-20 14:14:17.375636		
04d67e85-4794-460f-922c-ecda1a88d41d	1403	Marvel : Les Agents du S.H.I.E.L.D.	Suite aux évènements survenus dans THE AVENGERS, l'agent Phil Coulson retourne au sein de l'organisation mondiale du maintien de l'ordre, le S.H.I.E.L.D., pour y mettre sur pied une petite équipe d'agents extrêmement bien entraînés afin de s'attaquer aux affaires non encore classées ayant un trait aux phénomènes nouveaux, étranges et inconnus. Constistuée du très intègre agent Grant Ward, expert en combat et renseignements, de l'agent Melinda May, pilote émérite et experte en arts martiaux et des très brillants, si ce n'est un peu étranges socialement, agents scientifiques Leo Fitz et Jemma Simmons, l'équipe sera épaulée par Skye, nouvelle recrue civile, hacker et fan de super-héros.	/j6pen1MBLKbBoXrzrHSxfsd0lrC.jpg	/qtr5i6hOm6oVzTYl3jOQAYP3oc7.jpg	2013-09-24	[18, 10765, 10759]		vf	hd	tv	75	t	2025-09-20 14:14:17.486997	2025-09-20 14:14:17.486997		
56a8b064-0288-4493-a3b9-582edd8cc51e	92782	Miss Marvel	Kamala Khan, aka Miss Marvel, est une adolescente américaine de confession musulmane vivant à Jersey City. Grande amatrice de jeux vidéo et insatiable rédactrice de fan-fiction, elle adore les super-héros, qui enflamment son imagination (surtout Captain Marvel). Mais elle peine à trouver sa place à la maison comme au lycée, jusqu’à ce qu’elle se découvre des superpouvoirs, semblables à ceux de ses héros. Elle se dit alors, peut-être de manière un peu prématurée, que tout va s’arranger.	/3x1eRyuz2NOOSXODDcDl9EjGRQ.jpg	/mfcLUWASJghU8MTNK38eYktfE83.jpg	2022-06-08	[10765, 10759, 35]		vf	hd	tv	63	t	2025-09-20 14:14:17.596625	2025-09-20 14:14:17.596625		
1938c6be-dc89-4f7a-ba5f-f7194f335c7b	212423	Marvel Lucha Libre : les origines du masque	Une série documentaire suit des catcheurs inspirés par les superhéros de Marvel au cours d'un tournoi spectaculaire couronné par un ultime duel pour remporter l'objet de toutes les convoitises : la ceinture-trophée de champion. La compétition pourrait toutefois être mise en péril par une substance dangereuse, El Simbionte.	/1JA0oQlAfnqpsu9DPB4XsqUEG8r.jpg	/sFGq4neyU2EQh0BcuEumc5RVdpp.jpg	2023-01-18	[18]		vf	hd	tv	62	t	2025-09-20 14:14:17.703507	2025-09-20 14:14:17.703507		
b0004ca6-1d7e-4cce-ac3f-dcc5864d4631	63181	Les Gardiens de la Galaxie	Peter Quill est Star-Lord, un aventurier impétueux qui, pour sauver l'univers de ses plus grandes menaces, s'associe à un quatuor de marginaux disparates, d'un raton laveur d'apparence humaine appelé Rocket Raccoon , d'un humanoïde végétal appelé Groot, l'énigmatique experte et chasseuse Gamora et du rude guerrier Drax le destructeur.	/jp989uJnHvgBlg5bwjNu6qqrgYs.jpg	/9yAhhj9toqP9z6CeoMbhJdNhXN3.jpg	2015-09-05	[10759, 16, 10751]		vf	hd	tv	71	t	2025-09-20 14:14:17.81276	2025-09-20 14:14:17.81276		
889043d2-2974-4287-8d90-1278200d04bf	114695	Les Légendes des Studios Marvel	L’univers cinématique Marvel continue de grandir et Les Légendes des Studios Marvel fête et codifie les événements passés. Redécouvrez des héros épiques, des méchants, et des moments de l’univers Marvel en préparation des histoires très attendues encore à venir. Chaque séquence dynamique est directement liée aux séries à découvrir en exclusivité sur Disney+, posant les bases des événements à venir. Les Légendes des Studios Marvel tisse le lien entre les histoires qui constituent l’inégalé Univers Cinématographique Marvel (UCM ou MCU en anglais).	/bj2663TEMoMvK2G1xCjln8nJAUQ.jpg	/2jPv3B0ikeGjEYZKDX8vJGXJrvh.jpg	2021-01-08	[99, 10759, 10765]		vf	hd	tv	74	t	2025-09-20 14:14:17.921684	2025-09-20 14:14:17.921684		
f2ea8ea0-7fa6-44b4-9f27-008a4e40042e	92788	Marvel Moon Girl et Devil le Dinosaure	Marvel Moon Girl et Devil le Dinosaure raconte les aventures de Lunella Lafayette, petit génie de 13 ans, et de son T-Rex de 10 tonnes. Après avoir accidentellement fait venir le dinosaure à New York, l’adolescente décide avec lui de protéger le quartier du Lower East Side.	/1cVB0YpbFoDdH5cI4tIQqpaAfJK.jpg	/ieZ9AdB3yJF9jZSVO39zZ9d4D1y.jpg	2023-02-10	[16, 10762, 10765]		vf	hd	tv	78	t	2025-09-20 14:14:18.029338	2025-09-20 14:14:18.029338		
3427849d-4c86-4731-a0f9-74d2470d7ea5	112851	Lego Marvel Avengers : énigme climatique	La Conférence sur le nettoyage de l'environnement est tout sauf un début en douceur lorsque Tony Stark se rend compte que son collègue concurrent est son rival Justin Hammer!	/yeCEBB9eLeJ4nmj00ePD7eqeWYx.jpg	/eToeY9TLq4xd4kOLnuYFccH0S3H.jpg	2020-11-01	[16, 10762, 10751, 10759]		vf	hd	tv	46	t	2025-09-20 14:14:18.136629	2025-09-20 14:14:18.136629		
ca5031fd-e7ee-4047-8d3b-bda024119cd6	118924	Marvel Studios : Rassemblement	Rassemblement est une série documentaire qui relate la création des nouveaux films et séries palpitants des Studios Marvel. Voyagez dans les coulisses de la production des séries WandaVision, Falcon et le Soldat de l'Hiver et Loki grâce à des images de tournage exclusives. Rejoignez les réalisateurs et célébrités telles que Scarlett Johansson et Jeremy Renner tandis qu'ils nous détaillent la genèse du film Black Widow et de la série Hawkeye. Rassemblement est une série immersive et à l'approche approfondie sur la création de la prochaine phase de l'Univers Cinématographique Marvel.	/ninmsC18gVz6vzYXVKyBMLhSYGl.jpg	/jQ0cQGugJABsFYvBhtWQQ8ftTGK.jpg	2021-03-12	[99]		vf	hd	tv	72	t	2025-09-20 14:14:18.245492	2025-09-20 14:14:18.245492		
8e2c2b38-c56c-4026-846c-7545e2656a30	68716	Marvel's Inhumans	Sur la face cachée de la Lune, la cité d'Attilan cache une communauté d'Inhumains vivant depuis plusieurs générations loin de la Terre. Alors que des Inhumains réapparaissent sur Terre après que des cristaux tératogènes ont été libérés en mer, le règne du roi Blackagar Boltagon, à la voix destructrice, est menacé par son frère Maximus, un Inhumain sans pouvoirs qui aspire à ce que ses semblables reprennent leur place sur Terre. La conspiration va forcer le roi, la reine Médusa, son conseiller Karnak et le chef de la garde royale Gorgone à trouver refuge sur Terre, sur l'île d'Oahu, pendant que Maximus prend le pouvoir.	/y3aFlpB4Vwn1Qz0WOTUOTf6GmPl.jpg	/5W9YCPMDF5TCudct2guf6b8iRFz.jpg	2017-09-29	[18, 10765, 10759]		vf	hd	tv	59	t	2025-09-20 14:14:18.355614	2025-09-20 14:14:18.355614		
3376fefa-5d0b-4c67-b67f-d143516c6334	69088	Marvel's Agents of S.H.I.E.L.D.: Vendetta	Avec la reconstruction officielle du S.H.I.E.L.D., Elena « Yo-Yo » Rodriguez, une Inhumaine collaborant avec l'agence, doit signer les Accords de Sokovie. En secret, elle part résoudre une affaire personnelle.	/bwJej7WdmGRMCMyuDlotwAqVX7S.jpg	/pvqasfLg6ALyTV1bAlg4hkrCdVu.jpg	2016-12-13	[10765, 10759, 18]		vf	hd	tv	71	t	2025-09-20 14:14:18.461779	2025-09-20 14:14:18.461779		
6a26ec73-d632-41a4-b61c-7a8a44ca66f7	230318	Открытый брак		/rFcLOQnqA4lUUo2hxvtkEj6tby7.jpg	/eK783Rwx7XW475cCRxLfIQcal6U.jpg	2023-06-15	[]		vf	hd	tv	85	t	2025-09-24 04:03:29.105754	2025-09-24 04:03:29.105754		
5d972c7c-79ef-40ae-818b-dc7899554170	43146	Marvel Anime : X-Men	Après Iron Man et Wolverine, Madhouse s'associe à Marvel pour une nouvelle adaptation d'X-Men. Cette adaptation japonaise est centrée sur le Professeur Xavier, Cyclope, Wolverine, Tornade, Le Fauve et Armor. Un an après la mort de Jean Grey, alors que l'organisation des X-Men a été dissoute, Hisako Ichiki (Armor) , une collégienne mutante vivant au nord-est du Japon est portée disparue. Le fondateur des X-Men, le Professeur Charles Xavier convoque à nouveau son équipe constituée de Cyclope, Tornade, Wolverine et Le Fauve. Malheureusement, la tâche s'avère un peu complexe car son équipe est dispersée aux quatre coins du monde... Une fois réunis, les X-Men se rendent au Japon pour tenter de retrouver Armor. Mais leur mission ne se déroule pas aussi bien que prévue. Ils tombent nez à nez avec les U-Men, un étrange groupe de mutants de très mauvaise augure...	/sXNDCbP5sjq1FeXBxGovN21VVOG.jpg	/ljN5lpujUbzznKrTKuujdOkmhzJ.jpg	2011-04-01	[10759, 16, 10765]		vf	hd	tv	73	t	2025-09-20 14:14:18.787326	2025-09-20 14:14:18.787326		
c784e18d-6383-4833-8fc4-571f7d6af36e	2164	Marvel Super Heroes	The Marvel Super Heroes est une série d'animation télévisée,\n\nElle présente les aventures de cinq super-héros Marvel\n\nEn France, la série fut diffusée dans les annees 1960 sur l'ORTF. Au Quebec, elle a été diffusée sous le titre générique Super Héros notamment en 1970 sur Tele-capitale.\n\nLes personnages, dont les aventures étaient alternativement présentés à l'écran, étaient : Captain America, Hulk (The Incredible Hulk), Iron Man, Thor (The Mighty Thor) et Namor (Sub-mariner).\n\nLa série, produite en couleur, présentait une animation très limitée car elle consistait à diffuser des images photocopiées de comics. Seules les lèvres étaient animées lors de discussion et parfois, lors de combat un bras ou une jambe. Les histoires étaient des reprises quasi-intégrales de comics de l'age d'argent des planches Originales.	/9mvW1d4Me2qYXoHpLwS3LelDDad.jpg	/wumQlzmEGhABxD84c6sFUq4qSug.jpg	1966-09-05	[16, 10759, 10765, 10762]		vf	hd	tv	66	t	2025-09-20 14:14:18.895936	2025-09-20 14:14:18.895936		
fb036132-de10-407e-80c9-f02626524797	45418	Marvel Anime : Iron Man	Tony Stark, alias Iron Man, se rend au Japon pour son projet Arc. Un projet censé offrir une nouvelle source d'énergie, gratuite au Japon.  Il ramène avec lui un nouveau prototype d'Iron Man, l'Iron Man Dio. En effet, Tony Stark a l'intention de se retirer du rôle d'Iron Man et pense laisser sa place à d'autres hommes.  Soucieux de son image au Japon, Tony Stark décide de faire un petit spectacle aérien avec son nouveau Iron Man Dio.  En plein vol, une étrange lumière rouge apparait sur l'écran de contrôle, Stark perd le contrôle de la machine et s'écrase.  Stark va alors essayer de chercher l'origine du problème. Au même moment, un testeur de l'Iron Man Dio perd également le contrôle de la machine et attaque le personnel du laboratoire.  Tony Stark revêt alors son Iron Man pour tenter de l'arrêter...	/zOTJT7JbzSrMBX2OCGPqUnkQA4y.jpg	/zXM9V1MUbSYh7MCMtmbJbXwnbUX.jpg	2010-10-01	[16, 10759, 10765]		vf	hd	tv	74	t	2025-09-20 14:14:19.004123	2025-09-20 14:14:19.004123		
5be243f0-be49-4c3f-8bc9-1cc831203761	67466	Marvel's Runaways	Un groupe d’adolescents découvre lors d’une soirée que leurs parents se livrent à un sacrifice humain dans la cave de leur maison... Derrière leur association appelée PRIDE se cache en réalité une secte aux objectifs bien mystérieux. Mais le petit groupe d’ado va également faire une étrange découverte : chacun est doté de super-pouvoirs !	/di2HQ7FsWv2xCiMPFh3VUOFXF8P.jpg	/pHURd96EW167jUd2Jf8XpgTiLJV.jpg	2017-11-21	[10759, 18, 10765]		vf	hd	tv	73	t	2025-09-20 14:14:19.112851	2025-09-20 14:14:19.112851		
e2e4fcb8-0a2c-48d9-8f2e-2e7e7c0d4d51	70796	La Fabuleuse Mme. Maisel	Dans le New York de 1958, Miriam “Midge” Maisel a tout ce dont elle peut rêver : un mari parfait, 2 enfants et un appartement élégant dans l'Upper West Side. Mais sa petite vie parfaite prend un virage inattendu lorsqu'elle se découvre un talent pour le stand-up.	/lJg0f2a46mjx4OoygZTsaoMJvTu.jpg	/vQ77kC1amsZECKIxkUIsMJCtBVp.jpg	2017-03-16	[35, 18]		vf	hd	tv	81	t	2025-09-20 14:14:19.2219	2025-09-20 14:14:19.2219		
4555dcc0-5bfd-49df-92eb-4c870c46a96a	61889	Marvel's Daredevil	Avocat luttant contre l'injustice et aveugle depuis l'enfance, Matt Murdock fait place au super-héros Daredevil lorsque la nuit tombe sur les rues de New York.	/doJ6axLfzLCDaPqFSSHjaSTYKb2.jpg	/qsnXwGS7KBbX4JLqHvICngtR8qg.jpg	2015-04-10	[80, 18, 10759]		vf	hd	tv	82	t	2025-09-20 14:14:19.330474	2025-09-20 14:14:19.330474		
378e7c86-7cf4-49e3-af9c-217a69ca4e20	102693	Marvel's 616	Focus sur les passerelles qui relient le monde qui nous entoure au foisonnant univers MARVEL riche en histoires, personnages et créateurs. Chaque épisode explore en détail le contexte historique, culturel et social des récits MARVEL.	/5cFDybXCUnGQU3j2ePrtGbEuQKO.jpg	/f7PJT5Vvc99vjEmo6JyfDs3p3ei.jpg	2020-11-20	[99]		vf	hd	tv	74	t	2025-09-20 14:14:19.439916	2025-09-20 14:14:19.439916		
36edaeed-3a00-422a-be78-d32017e3770f	67178	Marvel's The Punisher	Un ancien Marine déterminé à punir les criminels qui ont assassiné sa femme et ses enfants se retrouve plongé au cœur d'un complot militaire.	/ioWV96X8lFnjO8PPAl6ayfZGjkM.jpg	/jBGjbSDRxOEudW9rmQbWDzJUKq9.jpg	2017-11-17	[10759, 80, 18]		vf	hd	tv	81	t	2025-09-20 14:14:19.775244	2025-09-20 14:14:19.775244		
73ee6669-83a3-4bd7-a287-54c7ae83bf77	92804	Alix et les merveilleux	Sous son escalier, Alix découvre un passage menant à un monde fantaisiste où vivent d’étonnants personnages. Dans cet univers, la jeune fille débordante d’imagination s’évade pour vivre des aventures rocambolesques en compagnie de Chapelier et de ses amis, les Merveilleux.	/38Wm4JiOtajqDOWdjlfesp5T2jE.jpg	/tJ2fGRBKNgEwt9GiCOJ1veKRHXu.jpg	2019-09-09	[10751, 10765, 18]		vf	hd	tv	38	t	2025-09-20 14:14:19.89209	2025-09-20 14:14:19.89209		
39a368d4-faab-4e40-a92f-c9e78a2cd629	138505	Marvel Zombies	L'univers Marvel est réimaginé alors qu'une nouvelle génération de héros se bat contre un fléau de zombies qui ne cesse de s'étendre.	/1fu3vZwqDEFOxFlitlDdYU86Ovr.jpg	/1jFOSFU5KOEy5CGAWens3PVL2R7.jpg	2025-09-24	[16, 10765]		vf	hd	tv	0	t	2025-09-20 14:14:20.002463	2025-09-20 14:14:20.002463		
9a3a68c7-4971-4278-b73c-fa76380befd6	83043	Marvel Rising: Initiation	Gwen Stacy AKA Ghost-Spider, accusée à tort d'un crime qu'elle n'a pas commis, cherche à effacer son nom et à rendre justice. Malheureusement, son père n'est pas seulement le capitaine du NYPD, mais il est le fer de lance de la chasse à l'homme! Pour aggraver les choses, d'autres jeunes héros — Mme. Marvel, Squirrel Girl, Quake et Patriot — recherchent également Ghost Spider. Mais, alors que la chasse pour découvrir la vérité tire à sa fin, une menace plus sombre se profile à l'horizon, et très bientôt, ces héros devront mettre de côté leurs différences et travailler ensemble en équipe.	/8z8Z7ZwFgatxp33fvxRKLyl2xd9.jpg	/eB36Ys5Kg84iFO0HO2ZbUNe34VR.jpg	2018-08-13	[16, 10759]		vf	hd	tv	67	t	2025-09-20 14:14:20.111705	2025-09-20 14:14:20.111705		
314911e2-0f34-4408-b6ac-a6e6538b6ed4	111312	Marvel's M.O.D.O.K.	Une série consacrée à l'emblématique super-vilain Marvel doté d’une intelligence supérieure et d’une cruauté sans bornes...	/gj3kzsAoBQ1U5tEu57qO0HP88q8.jpg	/zFOn9MgW1oSGyc8HKUAI3bV8NPc.jpg	2021-05-21	[35, 16, 10759, 10765]		vf	hd	tv	67	t	2025-09-20 14:14:20.330044	2025-09-20 14:14:20.330044		
19333b0b-fae9-41ce-b80f-28290b92b5a6	6145	Merveilles modernes	La série la plus longue d'HISTORY passe au H2. Modern Marvels célèbre l'ingéniosité, l'invention et l'imagination du monde qui nous entoure. Des objets courants comme l'encre et le café aux chefs-d'œuvre architecturaux et aux catastrophes d'ingénierie, la série à succès va au-delà des bases pour fournir un aperçu et une histoire des choses sur lesquelles nous nous posons des questions et qui ont un impact sur nos vies. Cette série raconte des histoires fascinantes des faiseurs, des rêveurs et parfois des intrigants qui créent des objets du quotidien, des percées technologiques et des merveilles artificielles. La série à succès explore en profondeur la pointe de l'inspiration et de l'ambition humaines.	/uRMi6q4mazNTZ2HKdiY6RP5noDW.jpg	/s7Puqpq4Yp67l8JfPZYwhDTVNi5.jpg	1993-12-10	[99]		vf	hd	tv	80	t	2025-09-20 14:14:20.439066	2025-09-20 14:14:20.439066		
0c1bd9a1-b65a-4170-9371-4d1330bc20b6	95313	Projet Héros Marvel	Cette série de 20 épisodes présente le changement remarquable et positif que plusieurs jeunes héros apportent dans leurs propres communautés à travers le pays. Ces enfants inspirants ont consacré leur vie à des actes de bravoure et de gentillesse désintéressés. Aujourd'hui, Marvel les célèbre comme les véritables super-héros qu'ils sont en leur souhaitant la bienvenue dans Marvel's Hero Project.	/3aDlpHghIUp1NoVM6m9hSEsLvJo.jpg	/pZQ5xrtvxVOLUCmZstvspYGxBFE.jpg	2019-11-12	[99, 10764, 10751, 10759, 10762, 10765]		vf	hd	tv	63	t	2025-09-20 14:14:20.546016	2025-09-20 14:14:20.546016		
071abc18-7376-47e0-8df5-dfed54b13151	38472	Marvel's Jessica Jones	Hantée par un passé traumatisant, la détective privée Jessica Jones cherche celui qui la persécute avant qu'il ne trouve quelqu'un d'autre à torturer à Hell's Kitchen.	/hCNUxbt8ohAYQhSnBChuknjxH8z.jpg	/g9ju2o4LioYYOyihBvf9lVX8XL.jpg	2015-11-20	[10765, 18]		vf	hd	tv	75	t	2025-09-20 14:14:20.655116	2025-09-20 14:14:20.655116		
ea612eb7-6368-482e-b151-dd0db5604dd4	62127	Marvel's Iron Fist	Alors qu'il était présumé mort, Danny Rand refait surface 15 ans plus tard. Avec le pouvoir de son poing d'acier, il va renouer avec le passé et accomplir sa destinée.	/v6qcpqlpyRqZzmIehW3eOssTW5K.jpg	/xHCfWGlxwbtMeeOnTvxUCZRGnkk.jpg	2017-03-17	[10759, 18, 10765, 80]		vf	hd	tv	65	t	2025-09-20 14:14:20.765998	2025-09-20 14:14:20.765998		
f64bd8a5-bf41-464e-bf1e-1a6d252680b8	133903	Marvel's Hit-Monkey	Dans les bas-fonds de Tokyo, un singe doué en arts martiaux s’entraîne auprès du fantôme d’un assassin américain afin d’accomplir sa vengeance auprès d’une organisation criminelle.	/91CZErNXEsfxlSpzb2wSsZrSH2L.jpg	/sqEyRJvBVF1YphHPWCfCRNWdIMe.jpg	2021-11-17	[16, 10759]		vf	hd	tv	77	t	2025-09-20 14:14:20.877136	2025-09-20 14:14:20.877136		
99ac4817-ce4d-424c-9783-b02cc3157ede	59427	Avengers Rassemblement	Marvel’s Avengers Assemble est une série animée racontant des histoires directement en lien avec le film The Avengers. Iron Man est le leader de cette équipe réunissant les plus puissants des superhéros: Hulk, Captain America, Thor, Hawkeye, Black Widow et un nouveau venu, Falcon. Ils allieront leurs forces face à des menaces qu'un seul ne peut pas vaincre. Quand les Avengers se réunissent, le mal n'a aucune chance de l'emporter.	/rj23nZ8nfSUegMt9tMTqkZ7zSIE.jpg	/hutyHRPoY0woAZCJtLmosJHuTjQ.jpg	2013-05-26	[10759, 16, 10765]		vf	hd	tv	76	t	2025-09-20 14:14:20.984566	2025-09-20 14:14:20.984566		
a8821648-cf73-43d9-954e-a21b3b3a42f2	62285	Marvel's The Defenders	Daredevil, Jessica Jones, Luke Cage et Iron Fist s'allient pour combattre leurs ennemis communs quand un sinistre complot menace New York de destruction.	/k8UOUmPzCHrflLHxvNhogsJGo8D.jpg	/72jj9y2Ejeub0mycZvkrPfT59sW.jpg	2017-08-18	[10765, 10759, 80]		vf	hd	tv	71	t	2025-09-20 14:14:21.092001	2025-09-20 14:14:21.092001		
f6be715f-7256-4c86-9a14-6d2f58939e86	61550	Agent Carter	En 1946, à la suite de la Seconde Guerre mondiale, la paix n’a pas aidé Peggy Carter qui se retrouve marginalisée après que les hommes sont rentrés du combat. Alors qu’elle travaille pour le SSR (Strategic Scientific Reserve), Peggy doit trouver un équilibre entre un poste administratif et des missions secrètes qu’elle effectue pour Howard Stark, tout en tentant de vivre sa vie de femme célibataire dans l’Amérique des années 1940, après avoir perdu l’homme de sa vie, Steve Rogers alias Captain America.	/fe79VYyLp5ZBstpJ4oukpuUT3B.jpg	/MaQ7hbNsiJ30p14UgRdEnXDGMH.jpg	2015-01-06	[18, 10765]		vf	hd	tv	75	t	2025-09-20 14:14:21.202162	2025-09-20 14:14:21.202162		
a098de93-cc4e-4da3-b33c-6b31e7701526	62126	Marvel's Luke Cage	À l'abri de sa capuche, un ancien détenu se bat pour blanchir son nom et sauver son quartier. Il ne cherchait pas la bagarre, mais les gens avaient besoin d'un héros.	/whnbD6LEjHenvda3A2cV2Vky531.jpg	/1zC6TJ4gQYQSjZUyZMeldxImqNg.jpg	2016-09-30	[18, 10765, 10759, 80]		vf	hd	tv	69	t	2025-09-20 14:14:21.310259	2025-09-20 14:14:21.310259		
6ec67a32-0e44-44bd-8ab5-b099602101b2	34391	Ultimate Spider-Man	Très doué, Peter Parker, est à 15 ans la risée de tous ses camarades au lycée. Lors d’une visite de classe dans les Entreprises Osborn, il est mordu par une araignée génétiquement modifiée. Quelques jours plus tard, l'adolescent réalise qu’il est doté d’un sixième sens hors du commun qui le prévient de tous les dangers et lui donne une force surhumaine et de super pouvoirs qu’il met au service des autres. Peter devient un justicier. Spider-Man est né !	/jK3pc8XOQT8UgdvSjMFk8xLQOxE.jpg	/gXeCzYmCRBlpbbhhKrYM1ZpIDAA.jpg	2012-04-01	[10762, 10759, 16, 35, 10751]		vf	hd	tv	77	t	2025-09-20 14:14:21.418212	2025-09-20 14:14:21.418212		
7b592a95-0c93-4cc1-be64-b24dd5a6de9a	95239	Superstructures : Merveilles technologiques	Une exploration des merveilles de l'ingénierie. Cette toute nouvelle série révèle les prouesses extraordinaires de l'ingénierie cachées à l'intérieur des constructions artificielles les plus spectaculaires au monde. Du plus grand avion au monde et du plus grand dôme à portée libre au plus haut bâtiment et au plus grand vaisseau spatial, chaque superstructure est démontée à l'aide d'images de synthèse à la pointe de la technologie et des connaissances de spécialistes de classe mondiale pour révéler les innovations surprenantes qui transforment le rêve en réalité.	/gXvICTRzhqaHeLlDyoFCcMDl8JR.jpg	/5x1XRZQGDq5GuI1FO9iKzAblVRq.jpg	2019-06-11	[99]		vf	hd	tv	68	t	2025-09-20 14:14:21.52624	2025-09-20 14:14:21.52624		
b5ad39cc-51bf-472e-909d-c01bd9656453	6673	Les Merveilleuses Mésaventures de Flapjack	Flapjack, un jeune garçon qui a été élevé par une baleine parlante nommée Bubule. Ils vivent une vie tranquille jusqu'à ce que le duo sauve la vie d'un pirate du nom de Capitaine Flibuste, qui raconte à Flapjack l'existence d'un endroit merveilleux appelé l'Ile de la confiserie...	/8dpk0bjBgX93ZkQxEI1daNSj3OW.jpg	/80KgNNF0bpoDvU5iNXT07Lgb2wL.jpg	2008-06-05	[10765, 35, 16]		vf	hd	tv	81	t	2025-09-20 14:14:21.634388	2025-09-20 14:14:21.634388		
ee7928a7-275a-49f5-b40a-ac4042bf8474	113903	Marvel Battleworld: Mystery of the Thanostones	Iron Man et ce groupe hétéroclite - Captain Marvel, Spider-Ham, Groot et Throg peuvent-ils comprendre ce que veut Thanos et pourquoi ils ont été amenés dans ce nouveau monde étrange ?	/wu7VuEO9eRCtul31pV8MvWwAxyI.jpg	/uQ74RD6wRLE3qOWU8Wie6ouzKaA.jpg	2020-06-17	[16, 10759]		vf	hd	tv	63	t	2025-09-20 14:14:23.451727	2025-09-20 14:14:23.451727		
242c7048-ad2f-4088-af0d-feaa7a533498	226757	Marvellous Love	Born with psychic powers, Cho-ueang is vilified as a bad omen against the community. When she is only small, her father performs a spell to keep her hidden and Cho-ueang winds up travelling hundreds of years into the future. There, a family takes her in and renames her Panruethai.\n\nUnexpectedly, Panruethai is returned to her original era, an era she has no memory of. All she knows is her powers have strengthened. Confused, she comes across a young man, Singkham, who mistakes her for a thief and apprehends her. However, she finds herself staying with him.	/9LAjVH33SAwhCi9xTEQVBFdHi7r.jpg	/zwL0PTy7oxHLp7oDUmk0XRePhmt.jpg	2023-05-15	[18, 10759, 10765]		vf	hd	tv	100	t	2025-09-20 14:14:21.742593	2025-09-20 14:14:21.742593		
48089de7-b38b-481b-b6db-0c4ae3a5a531	138136	Marvelous Woman	There are two women - one a childhood sweetheart and the other a proper wife - both are natural enemies yet they work together to promulgate the art of weaving. Set during the Qing Dynasty, the weaving industry of Gusu dominates the industry with its embroideries often sent to the palace as court tributes. The Ren family of Suzhou has perfected the style of weaving passed down from their ancestors for generations. The master of the house, Ren Xue Tang, has a gentle personality. On the contrary, his wife Shen Cui Xi is headstrong. With a personality like the thunder and the winds, she is swift and decisive. Under her management, the Ren family flourished and its craftsmanship grew in recognition so much that she has become known as the mother of the house. Ren Xue Yang unexpectedly gets into an accident while trying to track down smugglers.	/h9bnyM0SSfmELGvbUOdTixdEPOW.jpg	/7s1AmaDsFq4wkZGhEIrtyNl5Wmn.jpg	2021-11-08	[18]		vf	hd	tv	56	t	2025-09-20 14:14:21.852644	2025-09-20 14:14:21.852644		
85331890-82d4-4fa0-ba8f-ea471958a951	93508	Marvel Super Hero Adventures	Spider-Man avec les autres heros Marvel	/9D5tShfIdGPo7sUB4vbe7qZ1DSx.jpg	/90NsrW9A9s5XS4qQJeSdO4b34QO.jpg	2017-10-13	[16]		vf	hd	tv	63	t	2025-09-20 14:14:22.255919	2025-09-20 14:14:22.255919		
51ea711e-4b78-482e-b59c-a9c14d7817c1	239080	Tony Robinson's Marvellous Machines	Sir Tony Robinson travels the world to explore the most unusual and innovative machines and vehicles in this series packed with exciting stunts and epic challenges.	/hLNsseuPrtbJuhZqBY2cJKUUylF.jpg	/eADXFFE43t0BkwAcxtCCR6y6whX.jpg	2023-11-07	[99]		vf	hd	tv	80	t	2025-09-20 14:14:22.366316	2025-09-20 14:14:22.366316		
7a4de95b-738b-474c-9652-4225e179bb94	44623	Marvelous Melmo		/fY7OeOp0Bm2b6GdaWjPqSJ9ZmRh.jpg	\N	1971-10-03	[16, 35, 10765]		vf	hd	tv	53	t	2025-09-20 14:14:22.473332	2025-09-20 14:14:22.473332		
396ed102-270c-4bc4-8c59-4abfc9749fdb	73919	Ant-Man (Courts-Métrages)	Suivez les aventures d'Ant-Man contre des super-vilains ou de minuscules envahisseurs. Avec la Guêpe et Hank Pym, Ant-Man protège le monde, centimètre carré par centimètre carré.	/6msLuFmP5MjyDW6x8vXHnFM86li.jpg	/3QkMOMI3EPlhHAN1WFfXHRyTQSt.jpg	2017-06-10	[16, 35, 10759]		vf	hd	tv	63	t	2025-09-20 14:14:22.581839	2025-09-20 14:14:22.581839		
424173ff-fd99-4d77-b234-94fd3827faec	85347	Marvel's Eat the Universe	Summon the power of Galactus with 'Eat the Universe'! Join celebrity chef Justin Warner as he welcomes a wide array of guests to cook dishes inspired by Marvel's rich history.	/sOow1zTzjsYSvqoCjwJa5sAiiPa.jpg	/aH9zmS7EDwqSEDeI1xB3noTWuO2.jpg	2018-04-07	[]		vf	hd	tv	0	t	2025-09-20 14:14:22.690113	2025-09-20 14:14:22.690113		
99e48d6c-ecab-496a-a041-c2d2cd4aed4c	112193	Marvel's Ultimate Comics	Après que Spider-Man ait empêché certains escrocs de voler une installation de Stark Enterprises, Iron Man décide de le rembourser avec une formation en cours d'emploi. Son plan tourne mal lorsque le méchant Batroc the Leaper revient avec de nouveaux pouvoirs. Black Panther reçoit la visite d'Everett K. Ross pour discuter de la sécurité en vue d'un éventuel sommet international à Wakanda. La visite est interrompue de manière inattendue par le super-méchant, Ghost.	/6ObO02dL4QbzMuhnW3jU3XYkuAq.jpg	/AnMW7fcDFtQcrKe2x7SF17OrdXp.jpg	2016-11-04	[16]		vf	hd	tv	64	t	2025-09-20 14:14:22.799757	2025-09-20 14:14:22.799757		
4e38efda-ffa6-4f4d-9fd0-579679f639ba	228520	My Marvellous Fable	By chance, best-selling author Wang Pu Tao and rookie editor Feng Tian Lan have become colleagues. The story unfolds through their marvellous adventures in their journey home.\n\nAfter being attracted by a novel, Feng Tian Lan ends up working at a publishing house. He never expected that his first assignment would be to send reminders. Eccentric author Wang Pu Tao has not yet submitted her new work. After procrastinating for many days, she runs into Feng Tian Lan at the bar. Wang Pu Tao tells Feng Tian Lan that he needs to agree to her terms if he wants her to submit her work. As a result, the two embark on a journey together.	/4KfIWmhkrhpomhbEFDpbDFEtDhj.jpg	/1OCqKSrX2VC1gJo9eITi49b03BS.jpg	2023-06-11	[18, 10765]		vf	hd	tv	50	t	2025-09-20 14:14:22.908294	2025-09-20 14:14:22.908294		
9e58c44f-6e47-4ab3-a869-d91f3065a751	66190	Marvel's Cloak & Dagger	Tyrone Johnson et Tandy Bowen, deux adolescents issus de milieux sociaux différents, découvrent suite à leur rencontre qu'ils sont tous les deux dotés de superpouvoirs qui étaient jusqu'ici dormants et qui les lient mystérieusement l'un à l'autre. Face à leurs sentiments naissants et aux nombreuses menaces du monde qui les entoure, Tyrone et Tandy ne tardent pas à comprendre qu'ils sont plus forts ensemble et ont tout intérêt à s’allier plutôt qu’à poursuivre des routes séparées.	/ceyAU7dwMYUk16gLOEO7DowITPe.jpg	/4amkATUf2mh5QL9OQ3WmHQqx9wk.jpg	2018-06-07	[10759, 18, 10765]		vf	hd	tv	72	t	2025-09-20 14:14:23.018035	2025-09-20 14:14:23.018035		
1f9967ea-278d-4251-ac14-85a21387884c	25425	Bloomin' Marvellous	Bloomin' Marvellous is a 1997 BBC comedy series starring Clive Mantle, Sarah Lancashire, and Kathryn Hunt. Written by playwright John Godber, it is described as "a comedy about a couple who decide to start a family." The series was panned by most critics, and Mantle sarcastically remarked that "I've seen murderers and rapists get a better press than we did." However, several critics, such as Brian Viner of The Mail on Sunday, said that Bloomin' Marvellous had "charm, top-notch acting and a reasonable sprinkling of laughs, none of which are certainties in television comedy - especially the laughs."	\N	\N	1997-09-08	[]		vf	hd	tv	50	t	2025-09-20 14:14:23.126132	2025-09-20 14:14:23.126132		
3bf57eb9-4829-4c2a-84b9-59a52f1a3dc2	40044	Hulk et les Agents du S.M.A.S.H.	Dans cette équipe encore jamais vue de Hulk, sa cousine She-Hulk, A-Bomb, Red Hulk et Skaar, les super-héros les plus puissants de Marvel forment une famille excentrique, travaillant ensemble pour faire face aux menaces trop énormes pour être gérées par d'autres héros.	/gkGIiIIkHOeVXzwjBNFTRqTCnqF.jpg	/7p0QLfjFx1iJzJ6iB82mp7E9qIH.jpg	2013-08-11	[10759, 16, 10765]		vf	hd	tv	61	t	2025-09-20 14:14:23.235083	2025-09-20 14:14:23.235083		
9aefb339-4e95-41e2-a801-cf6a2c32ff05	94186	Underground Marvels	Des historiens, des ingénieurs et des experts examinent les structures, les systèmes et les phénomènes souterrains qui existent sous nos pieds.	/vs30k2C8gaVgaHEyP9u6S1uejbI.jpg	/tEVYuGVkt2P7qh3SqpX7zNeQSYa.jpg	2019-10-17	[99]		vf	hd	tv	60	t	2025-09-20 14:14:23.342446	2025-09-20 14:14:23.342446		
1f4fb40c-8f9d-4535-9228-e4aa7fed8571	205489	Marvel 101	Learn all about your favourite characters, places, objects and more from the House of Ideas! Find out the awesome origins and stupendous stories behind the brightest stars in the Marvel Universe.	/lp0Ctj6H6ggdot3NCqx1tsgSsQv.jpg	/mBybRCiTaBJylHXAX6GSlVk5tRp.jpg	2015-11-23	[]		vf	hd	tv	30	t	2025-09-20 14:14:23.776305	2025-09-20 14:14:23.776305		
9b4c9c3f-06a3-4564-942e-c9897374455e	230466	Dark Marvels	Since the dawn of civilization through modern times, humankind’s capacity for cruelty and darkness has known no bounds. Dark Marvels is a documentary series that explores the history and engineering behind the world’s most diabolical inventions. From devious torture and death devices, to terrifying weapons of war, sinister spy tools, and games that kill, these are the fascinating origin stories of the innovations that emerged from the darkest recesses of the most wicked minds.\n\nCompelling expert interviews, evocative recreations, archival footage, and premium 3D graphics unpack the twisted tales behind these nefarious technologies, their creators, and the historical figures who succumbed to their lethality. It’s a heart-pounding probe into evil ingenuity, that shows the darkest marvel of all is the human imagination.	/nsfBn9VXMNank368bPPsPg3LN75.jpg	/caaKLTaFg2FOeknCfA54YGAJWK6.jpg	2023-07-10	[99]		vf	hd	tv	72	t	2025-09-20 14:14:23.885526	2025-09-20 14:14:23.885526		
5f97acc0-3632-40b8-baf1-449302a25a2c	225735	Marvel Ultimate Comics: Absolute Carnage	Norman Osborn’s compulsion to destroy Spider-Man led to him joining with the Carnage symbiote to become the Red Goblin! But when he was defeated & the symbiote was violently ripped from him, it broke his psyche & made him believe he was Cletus Kasady	\N	\N	2019-08-14	[]		vf	hd	tv	0	t	2025-09-20 14:14:23.996875	2025-09-20 14:14:23.996875		
4b7b63f7-663f-4ecf-85d9-2d7975c73b88	11824	The Metric Marvels	The Metric Marvels is a series of seven animated educational shorts featuring songs about meters, liters, Celsius, and grams, designed to teach American children how to use the metric system. They were produced by Newall & Yohe, the same advertising agency which produced ABC's popular Schoolhouse Rock! series, and first aired on the NBC television network in September 1978. Voices for the Metric Marvels shorts included Lynn Ahrens, Bob Dorough, Bob Kaliban, and Paul Winchell.	\N	\N	1978-09-09	[10751, 16]		vf	hd	tv	60	t	2025-09-20 14:14:24.104771	2025-09-20 14:14:24.104771		
6a227418-0d1d-493a-abdf-38732af5a687	70784	Rocket et Groot	Avant de rejoindre les Gardiens de la Galaxie, Rocket et Groot étaient de simples chasseurs de primes. Quand leur fidèle vaisseau ne marche plus, ils sont contraints d'acheter le vaisseau le plus cher sur le marché !	/2rCNP3beEllDgMHhqHFzMbQRFf9.jpg	/jLuoxdI4S6JxOdlQYg57JLwDuEK.jpg	2017-03-10	[10762, 16, 10759, 10765, 35, 10751]		vf	hd	tv	68	t	2025-09-20 14:14:24.213494	2025-09-20 14:14:24.213494		
2ba3d3fa-2a48-4ea6-a317-d49ecd9c4aa0	221918	Icons Unearthed: Marvel	Des acteurs, des membres des équipes et des experts racontent en détail l'histoire secrète des films et des séries télévisées emblématiques.	/hg3mmw8jm96v7yiFUyHN1NAW6IP.jpg	/xydYZ83JWiyKYE6zuecbvnkGAx5.jpg	2023-03-07	[99]		vf	hd	tv	80	t	2025-09-20 14:14:24.322118	2025-09-20 14:14:24.322118		
34a3abbb-6701-4547-8c14-577aa6e365e4	1265344	Swipe	Récemment diplômée de l'université, Whitney Wolfe fait preuve d'une détermination et d'une ingéniosité sans égales pour percer dans le secteur de la tech largement dominé par les hommes. Son instinct et son talent seront à l’origine d’une application de rencontres innovante et mondialement reconnue (deux, en fait), lui ouvrant ainsi la voie vers le titre de « plus jeune femme milliardaire autodidacte ».	/8xOaenYc7q52Oz4LA5yRjLQmN7p.jpg	/6Gv1h3yDmyX42mh6TypoEdQO1yl.jpg	2025-09-09	[18]		vf	hd	movie	65	t	2025-09-20 17:07:12.240508	2025-09-20 17:07:12.240508		
2fa7744a-94c7-4c61-9f34-ed152e544fbe	1244953	Trust	À la suite d’un scandale, une starlette d’Hollywood se retire dans un chalet isolé. Mais elle n’est pas seule. Trahie par l’homme en qui elle avait le plus confiance, elle se retrouve piégée dans un jeu brutal de survie. Elle peut se cacher, mais pas s’enfuir.	/mqRUgC48o2PvHX9XiO4dUwKPG0R.jpg	/aJgTPBIkB5rovcF9FjUMl05W10D.jpg	2025-08-22	[53]		vf	hd	movie	43	t	2025-09-20 17:07:12.45858	2025-09-20 17:07:12.45858		
aa99ba1b-11ae-4f32-9b07-f65a3917c78a	247043	Bollywood barbare	Dans ce drame de haut vol, un outsider ambitieux et ses amis se retrouvent plongés dans le monde chaotique, extravagant et incertain de Bollywood.	/3Lyy9lbQuEE6RpWep2K1ozcjxjt.jpg	/tW80eVy19UxCp9WZrmLiztdthSE.jpg	2025-09-18	[35, 10759]		vf	hd	tv	72	t	2025-09-20 17:07:12.803179	2025-09-20 17:07:12.803179		
6ec1c2de-8b2d-419f-b5bd-2b38c3f412f6	60625	Rick et Morty	Un brillant inventeur et son petit fils un peu à l'Ouest partent à l'aventure...	/kKsdvIOfWhqw5ZfAepi5EZqhrsP.jpg	/Ao5pBFuWY32cVuh6iYjEjZMEscN.jpg	2013-12-02	[16, 35, 10765, 10759]		vf	hd	tv	87	t	2025-09-21 04:03:34.915974	2025-09-21 04:03:34.915974		
f40a3bd7-f758-4eba-9c7b-15d66ad33c79	81356	Sex Education	Le timide Otis connaît tout sur le sexe... grâce à sa mère thérapeute. La rebelle Maeve le décide donc à ouvrir un cabinet de conseil clandestin au lycée.	/hVk1hhJjyeTSCk3Fiy6p0W5pPxK.jpg	/u23G9KZregWHs1use6ir1fX27gl.jpg	2019-01-11	[35, 18]		vf	hd	tv	82	t	2025-09-21 04:03:35.203987	2025-09-21 04:03:35.203987		
e7ef87b0-cc27-463c-9d9c-6aab336be69e	240411	DAN DA DAN	Entre menaces paranormales, nouveaux super-pouvoirs et histoire d'amour naissante, deux lycéens se mettent au défi de prouver l'existence des fantômes ou des extraterrestres.	/dse3OM0apuA6HZt4gznRMmUirM3.jpg	/uNTrRKIOyKYISthoeizghtXPEOK.jpg	2024-10-04	[16, 10759, 35, 10765]	https://zupload.cc/embed/kXHdlQd2HPGFyGT	vf	hd	tv	86	t	2025-09-20 17:07:13.009531	2025-09-23 23:00:30.87		
73509af6-59c0-4186-820a-1b5db81b8c0a	1011477	Karate Kid : Legends	Li Fong, un adolescent qui fréquente l'école de kung-fu de M. Han en Chine, doit déménager à New York avec sa mère. Celle-ci souhaite que son fils intègre une école prestigieuse et qu'il mette de côté son sport de combat. À son arrivée dans sa nouvelle ville, Li rencontre Mia, une camarade de classe, ainsi que le père de celle-ci avec lesquels il se lie d'amitié. Li se retrouve ensuite entraîné dans une compétition d'arts martiaux où il doit affronter un redoutable champion de karaté.	/jorVfsm5DiZkuESRJZxjjs0fAf2.jpg	/7Q2CmqIVJuDAESPPp76rWIiA0AD.jpg	2025-05-08	[28, 12, 18]	https://zupload.cc/embed/fgZsz3MDvik62DA	vf	hd	movie	71	t	2025-09-20 17:07:12.527899	2025-09-23 23:55:00.228		
5b7ee408-b17a-4a5b-a538-261175bc6734	127235	Invasion	Alors que la Terre est visitée par des extraterrestres qui menacent l’humanité, cinq personnes ordinaires dispersées sur la planète s’efforcent de donner un sens aux évènements dont ils sont témoins et au chaos qui les entoure.	/pgkp9sjyKO2fRwyK6smy0O92SoV.jpg	/i9IEOD1Li1y89xRHKH9kiE8dt9z.jpg	2021-10-21	[10765, 18]		vf	hd	tv	72	t	2025-09-21 04:03:35.26965	2025-09-21 04:03:35.26965		
64bfb368-f2a5-43af-9f08-6306ba3146ec	987400	Batman Azteca: Choque de imperios	À l'époque de l'empire aztèque, Yohualli Coatl est frappé par une tragédie lorsque son père est assassiné par les conquistadors espagnols. Afin d'avertir le roi Moctezuma et son grand prêtre, Yoka, du danger imminent, Yohualli s'enfuit à Tenochtitlán. Là, il s'entraîne dans le temple du dieu chauve-souris Tzinacan avec son mentor, développant des équipements et des armes pour affronter l'invasion espagnole et venger la mort de son père. En chemin, il rencontre des personnages clés tels que la féroce Femme Jaguar et le conquistador Hernán Cortés.	/wpMaI2J3ISYZiaIWNkoA1lVb5LQ.jpg	/9KSboWOt09J72aMY4x8SS1IaOHK.jpg	2025-09-18	[16, 28, 12]		vf	hd	movie	73	t	2025-09-21 18:10:39.386576	2025-09-21 18:10:39.386576		
0e7c79cd-2f71-468e-824e-ea1bda2c9e53	245648	El refugio atómico	Quand un groupe de milliardaires se terre dans un bunker de luxe pour échapper à un conflit mondial sans précédent, une vieille querelle entre deux familles refait surface.	/lWfquJ2SqTZ18zyeGqj7wPchS08.jpg	/cyqKNRLFKCN9Y28ln38hLMESGEj.jpg	2025-09-19	[10765, 18]		vf	hd	tv	60	t	2025-09-21 18:10:42.721701	2025-09-21 18:10:42.721701		
155d2133-c853-47d3-9301-e8fb05f0d272	2261	The Tonight Show avec Johnny Carson	Le 1er octobre 1962, Groucho Marx accueillit Johnny Carson comme le nouveau présentateur du The Tonight Show.\n\nL’émission a été filmée à New York pendant pratiquement les dix premières années, avec Johnny Carson en tant que présentateur. Puis à partir de mai 1972, le plateau déménagea au Studio One à Burbank en Californie pour le reste de son « mandat » .	/uSvET5YUvHNDIeoCpErrbSmasFb.jpg	/qFfWFwfaEHzDLWLuttWiYq7Poy2.jpg	1962-10-01	[10767]		vf	hd	tv	75	t	2025-09-21 18:10:43.219466	2025-09-21 18:10:43.219466		
b829530c-c029-425d-b265-9e8c56121f6a	59941	Le Tonight Show	Mêlant humour et talk-show, Jimmy Fallon reçoit des personnalités de la musique, du cinéma, ou encore du sport, pour un entretien.	/1g9k0mSogSkkC7aRZlrTvGYMudE.jpg	/7VO04TtL1jIT6XOPs9u4jdB8KaB.jpg	2014-02-17	[35, 10767]		vf	hd	tv	59	t	2025-09-21 18:10:43.289246	2025-09-21 18:10:43.289246		
ce5378e1-b342-4b16-912e-f76c519e0360	1054867	Une bataille après l'autre	Une bande d'anciens révolutionnaires se réunit pour sauver la fille de l'un des leurs quand leurs ennemis refont surface après 16 ans.	/qOlG4JqEdK3qK42WwWt8SlxlnIt.jpg	/nB0QxPmgIFWxuwKorlJGOQdFEaa.jpg	2025-09-23	[28, 80, 53]		vf	hd	movie	86	t	2025-09-24 04:03:28.319419	2025-09-24 04:03:28.319419		
87d39e3f-4028-41dd-b919-aeba2bf58b8b	1100988	28 Ans plus tard	Cela fait près de trente ans que le Virus de la Fureur s’est échappé d’un laboratoire d’armement biologique. Alors qu’un confinement très strict a été mis en place, certains ont trouvé le moyen de survivre parmi les personnes infectées. C’est ainsi qu’une communauté de rescapés s’est réfugiée sur une petite île seulement reliée au continent par une route, placée sous haute protection. Lorsque l’un des habitants de l’île est envoyé en mission sur le continent, il découvre que non seulement les infectés ont muté, mais que d’autres survivants aussi, dans un contexte à la fois mystérieux et terrifiant…	/3ACUg2j2ZsgrwT1RnaBmni8mOuI.jpg	/zav0v7gLWMu6pVwgsIAwt11GJ4C.jpg	2025-06-18	[27, 53, 878]		vf	hd	movie	67	t	2025-09-24 04:03:28.380098	2025-09-24 04:03:28.380098		
3dd3b672-76fa-4861-9bd8-03becf6636a2	1516738	Marvel Studios' The Fantastic Four: First Steps - World Premiere	Marvel's First Family has arrived! Join the cast, crew, and fans live from the blue carpet at the World Premiere of Marvel Studios' The Fantastic Four: First Steps.	/z7wI0jpec9gz2IwVciND1nbRBy0.jpg	/w11jDQLxoPMmlzgyoof0F0NtYXP.jpg	2025-07-21	[99]	https://zupload.cc/embed/fgZsz3MDvik62DA	vf	hd	movie	59	t	2025-09-20 14:14:14.946064	2025-09-24 00:02:18.77		
e58041e9-0f17-4ef7-b9c9-f1d56ad02e97	986056	Thunderbolts*	Yelena Belova, Bucky Barnes, Red Guardian, Le Fantôme, Taskmaster et John Walker sont les Thunderbolts. Tombés dans un piège redoutable tendu par Valentina Allegra de Fontaine, ces laissés pour compte complètement désabusés doivent participer à une mission à haut risque qui les forcera à se confronter aux recoins les plus sombres de leur passé. Ce groupe dysfonctionnel se déchirera-t-il ou trouvera-t-il sa rédemption en s’unissant avant qu’il ne soit trop tard ?	/zctISSBEZRgVQPG178HqRJMnc4x.jpg	/rthMuZfFv4fqEU4JVbgSW9wQ8rs.jpg	2025-04-30	[28, 878, 12]	https://zupload.cc/embed/fgZsz3MDvik62DA	vf	hd	movie	74	t	2025-09-20 04:23:46.117755	2025-09-24 00:09:19.422		
b04403cc-ba29-4de8-a8ea-531fc0883184	1450529	Gatillero		/moiLQPK2YjritOYG674DrWHvlgp.jpg	/bwP4UJZjjfAVOuTAWT8W8J2AKtG.jpg	2025-06-12	[53, 28]		vf	hd	movie	83	t	2025-09-24 04:03:27.953749	2025-09-24 04:03:27.953749		
1ff5f840-52c5-4874-ac9f-53850f767052	1447287	Donde tú quieras		/32kwv7gWBcIcI9mi5h5CwwLxZVw.jpg	\N	2025-03-20	[28]		vf	hd	movie	0	t	2025-09-24 04:03:28.062805	2025-09-24 04:03:28.062805		
ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	153312	Tulsa King	Dwight Manfredi, surnommé "Le Général", vient de sortir de prison où il a passé 25 ans. Cet ancien membre de la mafia new-yorkaise est cependant contraint de s'exiler à Tulsa dans l'Oklahoma. Il va y rassembler sa propre « famille » pour développer un empire criminel.	/rOYLWCdAifpUtPlTf1WHxyaxeMt.jpg	/mNHRGO1gFpR2CYZdANe72kcKq7G.jpg	2022-11-13	[80, 18, 35]		vf	hd	tv	83	t	2025-09-24 04:03:28.55646	2025-09-24 04:03:28.55646		
9e52f737-d454-4745-98ff-4f4c06209b2b	271607	BLOOM	Rintaro, à l'allure imposante, et Kaoruko, à l'esprit ouvert, font connaissance et se rapprochent. Le problème ? Leurs lycées voisins sont rivaux.	/5AbCwgwOfxUZcOKsH0DRaM200b2.jpg	/lxVEmUsZscXk3xyCg4V5FCbvliF.jpg	2025-07-06	[16, 18, 35]		vf	hd	tv	88	t	2025-09-24 04:03:29.025797	2025-09-24 04:03:29.025797		
f7535e84-f7b6-42bb-944a-5c3c0f9bb90f	2224	Le Daily Show	Trevor Noah et l'équipe de la plus fausse information au monde abordent les plus grandes histoires de l'actualité, de la politique et de la culture pop.	/np5l5SGS990ZV6FcP9CCRPq3hSe.jpg	/qLMfcvdCcCGD2BNLH8b6ZCBuO7D.jpg	1996-07-22	[10763, 35]		vf	hd	tv	64	t	2025-09-24 04:03:29.17875	2025-09-24 04:03:29.17875		
32dd01fe-c7b3-42a3-8b53-b69808cb1c90	250307	The Pitt	Dans l'Amérique d'aujourd'hui, les professionnels de la santé sont confrontés à de nombreux défis au sein d'un hôpital de Pittsburgh, en Pennsylvanie.	/tXjhN4bsHiB56lqbwhHBLJpTlbA.jpg	/z3BkMbCy5ajZPMyKEUwsPHuz2cV.jpg	2025-01-09	[18]		vf	hd	tv	86	t	2025-09-24 04:03:29.244097	2025-09-24 04:03:29.244097		
6a3e4ee1-f496-40e6-b5d7-d87e6bf665c7	206559	Binnelanders		/3bzECfllho8PphdYujLUIuhncJD.jpg	/s1dTt4M31q2HwD5Fkl1tf5tQzJg.jpg	2005-10-13	[10766]		vf	hd	tv	56	t	2025-09-24 04:03:29.304133	2025-09-24 04:03:29.304133		
8231538a-a511-41ce-96b4-358b06052936	1337395	Kiskisan		/zs7UlTjgUy0VfUC0qJPklLmpPnY.jpg	/ibpjFkCB4klvDOmmFhgmLnPNqAF.jpg	2024-09-27	[18]	https://zupload.cc/watch/sample123	vf	hd	movie	68	f	2025-09-21 20:33:43.135554	2025-09-24 04:23:43.1		
4195aad9-a50e-4d73-a01b-dc19650d6e51	7225	Merlin	Dans la mythique cité de Camelot, certaines histoires se racontent comme on le fait aujourd&amp;#x27;hui, au XXIème siècle. Entre enchantements et mystères, c&amp;#x27;est là qu&amp;#x27;un jeune homme nommé Merlin se lie d&amp;#x27;amitié avec un certain Arthur... 	&amp;#x2F;8eR5Jg7CxsuCOEBU5wW0opObxpi.jpg	&amp;#x2F;2JcrP4gNhU3KMbdajoEi1OvDl1Y.jpg	2008-09-20	["10759", "18", "10765"]		vf	hd	tv	78	t	2025-09-24 04:21:13.057154	2025-09-24 05:29:26.707		
ebc9edc0-ad5f-4178-a866-dce0533fc05c	155	The Dark Knight : Le Chevalier noir	Batman aborde une phase décisive de sa guerre contre le crime à Gotham City. Avec l'aide du lieutenant de police Jim Gordon et du nouveau procureur Harvey Dent, il entreprend de démanteler les dernières organisations criminelles qui infestent les rues de la ville. L'association s'avère efficace, mais le trio se heurte bientôt à un nouveau génie du crime qui répand la terreur et le chaos dans Gotham : le Joker. On ne sait pas d'où il vient ni qui il est. Ce criminel possède une intelligence redoutable doublé d'un humour sordide et n'hésite pas à s'attaquer à la pègre locale dans le seul but de semer le chaos.	/pyNXnq8QBWoK3b37RS6C3axwUOy.jpg	/enNubozHn9pXi0ycTVYUWfpHZm.jpg	2008-07-16	[18, 28, 80, 53]	https://zupload.cc/embed/RJqBMjsInhZXMPR	vf	hd	movie	85	t	2025-09-20 17:07:12.397606	2025-09-26 20:51:44.148		
a177ef9c-37a9-411b-a33a-4cbbe1081f56	1412	Arrow	Les nouvelles aventures de Green Arrow/Oliver Queen, combattant ultra efficace issu de l'univers de DC Comics et surtout archer au talent fou, qui appartient notamment à la Justice League. Disparu en mer avec son père et sa petite amie, il est retrouvé vivant 5 ans plus tard sur une île près des côtes Chinoises. Mais il a changé : il est fort, courageux et déterminé à débarrasser Starling City de ses malfrats...	/4DVLTc7oVCzHOSmZzlDHefCKyqq.jpg	/wAFuDJfZJrnh6a1wf1Vt7PqYBvR.jpg	2012-10-10	[80, 18, 10759]	https://zupload.cc/embed/RJqBMjsInhZXMPR	vf	hd	tv	68	t	2025-09-24 04:22:18.899842	2025-09-27 00:21:12.171		
6dc7b827-aa31-4566-a5a9-97977489558f	1009640	Valiant One	Un hélicoptère américain s'écrase du côté nord-coréen de la zone démilitarisée de Corée. Alors que les tensions entre le Nord et le Sud sont déjà au bord de la guerre, les militaires non combattants de l'armée américaine survivants doivent travailler ensemble pour trouver leur chemin à travers la zone, sans possibilité de soutien militaire américain.	/sT8Z14RDCAd6szzxzWFAU4xcMwg.jpg	/aIsjCdfiAS89cMjdDWEpKmUTHsZ.jpg	2025-01-30	[28, 10752]		vf	hd	movie	61	t	2025-09-27 01:37:17.991049	2025-09-27 01:37:17.991049		
98275123-9ac4-4baa-9e6a-09f0ff8644a8	1218925	Chainsaw Man – The Movie : Reze Arc	Après avoir mit hors d'état de nuire Katana Man, Denji va faire la rencontre de Reze, une jeune femme qui semble s'intéresser à lui.	/ieSTagNIFeIW2oVm4D9MDiLCHFY.jpg	/dh0dLVLDLqUKhtytCFjkf3EHeJI.jpg	2025-09-19	[16, 28, 14]		vf	hd	movie	92	t	2025-09-27 01:37:18.556436	2025-09-27 01:37:18.556436		
d1af059a-7e01-4847-aab3-b98783b7606b	228854	スターヴァージン		/idSnr7oBF1wg7z56ToGdu6Fbd76.jpg	/bS6t5dvoiKU1IMpPystTclNMucK.jpg	1988-06-05	[878, 35, 28]		vf	hd	movie	53	t	2025-09-27 01:37:18.647931	2025-09-27 01:37:18.647931		
284a21dd-364e-4993-9532-9c86de820faf	41264	Adieu Afrique	Adieu Afrique est un documentaire italien réalisé par Gualtiero Jacopetti et Franco Prosperi, sorti en 1966. Le film porte sur la fin de l'ère coloniale en Afrique.	/651NOr6fVXb1yaAQtJriy0QiNAG.jpg	/g961TJZSGL8RzWGwpFK3Us77SfM.jpg	1966-02-11	[99, 27]		vf	hd	movie	64	t	2025-09-27 01:37:18.737623	2025-09-27 01:37:18.737623		
0b62f4a1-6211-4fb1-bf09-cabf9fae9352	110316	Alice in Borderland	Un gamer paumé et ses deux amis se retrouvent dans un Tokyo parallèle, où ils sont contraints de participer à une série de jeux sadiques pour survivre.	/217V9dhelgjELLZGawTmRJ0NNb7.jpg	/bKxiLRPVWe2nZXCzt6JPr5HNWYm.jpg	2020-12-10	[9648, 18, 10759]		vf	hd	tv	82	t	2025-09-27 01:37:18.897311	2025-09-27 01:37:18.897311		
593d1019-47cf-41cc-93d7-f4bf9f341fd5	95480	Slow Horses	Une équipe d’agents secrets britanniques mis au placard par le MI5 suite aux erreurs qu’ils ont commises en mission. Placés sous les ordres d’un chef aussi brillant qu’irascible, le célèbre Jackson Lamb, ils naviguent dans le monde de l’espionnage, où règnent les faux-semblants, pour défendre la Grande-Bretagne contre les forces ennemies.	/7h2vBQYYbY20OTMTbVALyBNgHxy.jpg	/bDfboQUb45Cv9MYyVBDZw8M8xSM.jpg	2022-04-01	[80, 18, 35]		vf	hd	tv	80	t	2025-09-27 01:37:19.37745	2025-09-27 01:37:19.37745		
bf054f43-920c-40d5-9ab4-82652c738ba9	71712	Good Doctor	Atteint d'un trouble du spectre de l'autisme, avec un haut niveau de fonctionnement, le Docteur en chirurgie Shaun Murphy rejoint un prestigieux hôpital de San Jose, en Californie. Isolé, il éprouve des difficultés à s'intégrer à l'équipe. Mais en mettant son incroyable don de savant au service de ses patients, ce jeune prodige finit par susciter l'admiration de ses collègues, même les plus sceptiques.	/53WqEWbwQQ3WsO6cOWkzNbym43.jpg	/f3cin9kOz4nOrlYEMxGFQhv4bdN.jpg	2017-09-25	[18]		vf	hd	tv	85	t	2025-09-27 01:37:19.859569	2025-09-27 01:37:19.859569		
e360c897-c5fc-46ec-8b1a-f85ee6272c27	272711	ไหนเฮียบอกไม่ชอบเด็ก		/qxwt5PFKOZhkK4I5rG4QkBKwdqJ.jpg	/sZV5OisM3bbFI6nWgzmLvPfUdPz.jpg	2025-04-20	[18]		vf	hd	tv	76	t	2025-09-27 01:37:19.927799	2025-09-27 01:37:19.927799		
\.


--
-- Data for Name: episodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.episodes (id, content_id, season_number, episode_number, title, description, odysee_url, mux_playback_id, mux_url, duration, release_date, active, created_at, updated_at) FROM stdin;
5fb36da1-adb5-456d-819b-a06a09189e76	155d2133-c853-47d3-9301-e8fb05f0d272	1	1	Épisode 1			\N	\N	\N		t	2025-09-21 19:17:35.255322	2025-09-21 19:17:35.255322
ee590ccf-a939-4ff4-adcd-0fb3f26f082f	155d2133-c853-47d3-9301-e8fb05f0d272	1	2	Épisode 2			\N	\N	\N		t	2025-09-21 19:17:35.342035	2025-09-21 19:17:35.342035
eea96430-3bfe-4a0f-9189-368e6eb5c8e0	155d2133-c853-47d3-9301-e8fb05f0d272	1	3	Épisode 3			\N	\N	\N		t	2025-09-21 19:17:35.427318	2025-09-21 19:17:35.427318
6ede8b49-afaa-4fbe-ac7e-db9d3a9881cc	155d2133-c853-47d3-9301-e8fb05f0d272	1	4	Épisode 4			\N	\N	\N		t	2025-09-21 19:17:35.503808	2025-09-21 19:17:35.503808
cf2951a4-8ba6-4410-9bee-b6fcaab66783	155d2133-c853-47d3-9301-e8fb05f0d272	1	5	Épisode 5			\N	\N	\N		t	2025-09-21 19:17:35.58249	2025-09-21 19:17:35.58249
5fb0ae18-baa0-450c-acfd-127ed580d5e3	155d2133-c853-47d3-9301-e8fb05f0d272	1	6	Épisode 6			\N	\N	\N		t	2025-09-21 19:17:35.664701	2025-09-21 19:17:35.664701
6b89a947-ccd7-43bc-8829-4a72016ba897	155d2133-c853-47d3-9301-e8fb05f0d272	1	7	Épisode 7			\N	\N	\N		t	2025-09-21 19:17:35.747063	2025-09-21 19:17:35.747063
2aa010f1-1957-4e76-81a4-634f791d419a	155d2133-c853-47d3-9301-e8fb05f0d272	1	8	Épisode 8			\N	\N	\N		t	2025-09-21 19:17:35.824158	2025-09-21 19:17:35.824158
884fc53e-aac1-42cd-a44b-e5707ff48d4d	155d2133-c853-47d3-9301-e8fb05f0d272	1	9	Épisode 9			\N	\N	\N		t	2025-09-21 19:17:36.193984	2025-09-21 19:17:36.193984
f5ac5f8b-9b40-4276-894b-a753f6fec7af	155d2133-c853-47d3-9301-e8fb05f0d272	1	10	Épisode 10			\N	\N	\N		t	2025-09-21 19:17:36.271219	2025-09-21 19:17:36.271219
b3184a0a-cf65-47c0-8513-9a3416e875f6	155d2133-c853-47d3-9301-e8fb05f0d272	1	11	Épisode 11			\N	\N	\N		t	2025-09-21 19:17:36.344759	2025-09-21 19:17:36.344759
248ecb8b-1d30-49e5-99f8-442499b6f95d	155d2133-c853-47d3-9301-e8fb05f0d272	1	12	Épisode 12			\N	\N	\N		t	2025-09-21 19:17:36.410809	2025-09-21 19:17:36.410809
bd0c341e-7f56-4abf-924d-410c0a16c1f3	155d2133-c853-47d3-9301-e8fb05f0d272	1	13	Épisode 13			\N	\N	\N		t	2025-09-21 19:17:36.486913	2025-09-21 19:17:36.486913
bb8ca257-ebb9-43e1-9918-227fc579a5a3	155d2133-c853-47d3-9301-e8fb05f0d272	1	14	Épisode 14			\N	\N	\N		t	2025-09-21 19:17:36.556673	2025-09-21 19:17:36.556673
e68a7671-4f30-4cc1-a15d-2d3a745a281f	155d2133-c853-47d3-9301-e8fb05f0d272	1	15	Épisode 15			\N	\N	\N		t	2025-09-21 19:17:36.628738	2025-09-21 19:17:36.628738
73e1dcf5-5b7d-44ac-8be1-6501cd42dee2	155d2133-c853-47d3-9301-e8fb05f0d272	1	16	Épisode 16			\N	\N	\N		t	2025-09-21 19:17:36.697771	2025-09-21 19:17:36.697771
19da1dd7-301a-46aa-a020-d933e6496444	155d2133-c853-47d3-9301-e8fb05f0d272	1	17	Épisode 17			\N	\N	\N		t	2025-09-21 19:17:36.77158	2025-09-21 19:17:36.77158
c722e813-6b40-4f89-bcd2-14a2c90b770d	155d2133-c853-47d3-9301-e8fb05f0d272	1	18	Épisode 18			\N	\N	\N		t	2025-09-21 19:17:36.84246	2025-09-21 19:17:36.84246
bbe38d10-80d7-466a-ab43-8ab9c863882c	155d2133-c853-47d3-9301-e8fb05f0d272	1	19	Épisode 19			\N	\N	\N		t	2025-09-21 19:17:37.191735	2025-09-21 19:17:37.191735
6cec020d-4c64-47f0-bbb5-adb9c8a323a4	155d2133-c853-47d3-9301-e8fb05f0d272	1	20	Épisode 20			\N	\N	\N		t	2025-09-21 19:17:37.271773	2025-09-21 19:17:37.271773
22db64b6-b33e-4716-8384-c994b06febfe	155d2133-c853-47d3-9301-e8fb05f0d272	1	21	Épisode 21			\N	\N	\N		t	2025-09-21 19:17:37.357628	2025-09-21 19:17:37.357628
7537b5ad-d61f-4d2f-aff5-423307429d1a	155d2133-c853-47d3-9301-e8fb05f0d272	1	22	Épisode 22			\N	\N	\N		t	2025-09-21 19:17:37.42695	2025-09-21 19:17:37.42695
59fef501-627d-4ed9-8136-1d4307542817	155d2133-c853-47d3-9301-e8fb05f0d272	1	23	Épisode 23			\N	\N	\N		t	2025-09-21 19:17:37.498604	2025-09-21 19:17:37.498604
c3aac677-6633-47a5-9fb9-4964367a3362	155d2133-c853-47d3-9301-e8fb05f0d272	1	24	Épisode 24			\N	\N	\N		t	2025-09-21 19:17:37.574537	2025-09-21 19:17:37.574537
f51664c1-ab54-42ba-af52-8f75eb0c12dd	155d2133-c853-47d3-9301-e8fb05f0d272	1	25	Épisode 25			\N	\N	\N		t	2025-09-21 19:17:37.645452	2025-09-21 19:17:37.645452
188d4349-1b97-40c2-9518-b194a2aacbf8	155d2133-c853-47d3-9301-e8fb05f0d272	1	26	Épisode 26			\N	\N	\N		t	2025-09-21 19:17:37.720994	2025-09-21 19:17:37.720994
311972b2-1f69-4b8d-b648-7bad48e5cc57	155d2133-c853-47d3-9301-e8fb05f0d272	1	27	Épisode 27			\N	\N	\N		t	2025-09-21 19:17:37.792905	2025-09-21 19:17:37.792905
7003130f-e1ee-45de-bff8-b9e00a37be11	155d2133-c853-47d3-9301-e8fb05f0d272	1	28	Épisode 28			\N	\N	\N		t	2025-09-21 19:17:37.859874	2025-09-21 19:17:37.859874
4e0b696a-e39c-4377-a565-fc253383e95a	155d2133-c853-47d3-9301-e8fb05f0d272	1	29	Épisode 29			\N	\N	\N		t	2025-09-21 19:17:38.210423	2025-09-21 19:17:38.210423
23f07a99-2082-49fd-9750-419a53ab7918	155d2133-c853-47d3-9301-e8fb05f0d272	1	30	Épisode 30			\N	\N	\N		t	2025-09-21 19:17:38.274874	2025-09-21 19:17:38.274874
230cc672-b4cf-4696-970c-cba70789251d	155d2133-c853-47d3-9301-e8fb05f0d272	1	31	Épisode 31			\N	\N	\N		t	2025-09-21 19:17:38.352775	2025-09-21 19:17:38.352775
09c1a5ed-5f99-455e-80b2-587ff80ed1ea	155d2133-c853-47d3-9301-e8fb05f0d272	1	32	Épisode 32			\N	\N	\N		t	2025-09-21 19:17:38.420466	2025-09-21 19:17:38.420466
ff054160-51d4-4028-ad8b-72e85570d174	155d2133-c853-47d3-9301-e8fb05f0d272	1	33	Épisode 33			\N	\N	\N		t	2025-09-21 19:17:38.499032	2025-09-21 19:17:38.499032
55a717dd-78ba-4139-942f-37cf5e7cd005	155d2133-c853-47d3-9301-e8fb05f0d272	1	34	Épisode 34			\N	\N	\N		t	2025-09-21 19:17:38.568181	2025-09-21 19:17:38.568181
87a0c393-7390-49de-bf69-35d81eae218d	155d2133-c853-47d3-9301-e8fb05f0d272	1	35	Épisode 35			\N	\N	\N		t	2025-09-21 19:17:38.641132	2025-09-21 19:17:38.641132
5f6dff40-fc0a-41ae-93ec-6704338557bb	155d2133-c853-47d3-9301-e8fb05f0d272	1	36	Épisode 36			\N	\N	\N		t	2025-09-21 19:17:38.711034	2025-09-21 19:17:38.711034
4d6f06ae-4d37-4b60-8fd4-f0cacbe9b0bf	155d2133-c853-47d3-9301-e8fb05f0d272	1	37	Épisode 37			\N	\N	\N		t	2025-09-21 19:17:38.787756	2025-09-21 19:17:38.787756
4f03c5fd-1118-496c-b914-80d8162efe2e	155d2133-c853-47d3-9301-e8fb05f0d272	1	38	Épisode 38			\N	\N	\N		t	2025-09-21 19:17:38.857847	2025-09-21 19:17:38.857847
4e31485a-9f67-481a-84b0-1da3c0fdd865	155d2133-c853-47d3-9301-e8fb05f0d272	1	39	Épisode 39			\N	\N	\N		t	2025-09-21 19:17:39.18981	2025-09-21 19:17:39.18981
20afed70-229a-4e88-90f4-f52c8e128f72	155d2133-c853-47d3-9301-e8fb05f0d272	1	40	Épisode 40			\N	\N	\N		t	2025-09-21 19:17:39.274916	2025-09-21 19:17:39.274916
15c64bff-ae31-4487-9859-f0015304bda2	155d2133-c853-47d3-9301-e8fb05f0d272	1	41	Épisode 41			\N	\N	\N		t	2025-09-21 19:17:39.344183	2025-09-21 19:17:39.344183
ba0b2c70-6605-4488-9767-1617e7631e91	155d2133-c853-47d3-9301-e8fb05f0d272	1	42	Épisode 42			\N	\N	\N		t	2025-09-21 19:17:39.418708	2025-09-21 19:17:39.418708
a23bda0f-4f6f-4318-aecb-b374404c3ac7	155d2133-c853-47d3-9301-e8fb05f0d272	1	43	Épisode 43			\N	\N	\N		t	2025-09-21 19:17:39.492516	2025-09-21 19:17:39.492516
26f7e3cc-bc68-4826-9828-b05f8088bf5f	155d2133-c853-47d3-9301-e8fb05f0d272	1	44	Épisode 44			\N	\N	\N		t	2025-09-21 19:17:39.565579	2025-09-21 19:17:39.565579
f77f069b-dcd9-406b-8417-37903d028fc7	155d2133-c853-47d3-9301-e8fb05f0d272	1	45	Épisode 45			\N	\N	\N		t	2025-09-21 19:17:39.649457	2025-09-21 19:17:39.649457
f74e26ac-fdb0-4d36-a2b7-daf6351aa070	155d2133-c853-47d3-9301-e8fb05f0d272	1	46	Épisode 46			\N	\N	\N		t	2025-09-21 19:17:39.719319	2025-09-21 19:17:39.719319
08e22a8f-d0a1-4ced-843e-b6214e4d3d41	155d2133-c853-47d3-9301-e8fb05f0d272	1	47	Épisode 47			\N	\N	\N		t	2025-09-21 19:17:39.791577	2025-09-21 19:17:39.791577
52ab623d-347b-4444-879f-96218cc1aac4	155d2133-c853-47d3-9301-e8fb05f0d272	1	48	Épisode 48			\N	\N	\N		t	2025-09-21 19:17:39.866688	2025-09-21 19:17:39.866688
c3ec8652-23e8-493d-9366-e8aa532be3bf	155d2133-c853-47d3-9301-e8fb05f0d272	1	49	Épisode 49			\N	\N	\N		t	2025-09-21 19:17:40.212517	2025-09-21 19:17:40.212517
7603710b-b8e1-4fd1-82cf-33f887dd4861	155d2133-c853-47d3-9301-e8fb05f0d272	1	50	Épisode 50			\N	\N	\N		t	2025-09-21 19:17:40.298325	2025-09-21 19:17:40.298325
2c303ea5-08bb-48f3-84a3-7b904ffb84bc	155d2133-c853-47d3-9301-e8fb05f0d272	1	51	Épisode 51			\N	\N	\N		t	2025-09-21 19:17:40.413794	2025-09-21 19:17:40.413794
a71ba44d-b94c-4d9e-b93d-31347f1f021b	155d2133-c853-47d3-9301-e8fb05f0d272	1	52	Épisode 52			\N	\N	\N		t	2025-09-21 19:17:40.541967	2025-09-21 19:17:40.541967
df6e827a-d237-44ca-a544-b468d8dc09f9	155d2133-c853-47d3-9301-e8fb05f0d272	1	53	Épisode 53			\N	\N	\N		t	2025-09-21 19:17:40.648277	2025-09-21 19:17:40.648277
d48662be-2543-4fef-801b-183276c3412b	155d2133-c853-47d3-9301-e8fb05f0d272	1	54	Épisode 54			\N	\N	\N		t	2025-09-21 19:17:40.783933	2025-09-21 19:17:40.783933
004a4945-c6be-422c-8ff9-53597336c44f	155d2133-c853-47d3-9301-e8fb05f0d272	1	55	Épisode 55			\N	\N	\N		t	2025-09-21 19:17:40.887784	2025-09-21 19:17:40.887784
e85fbc47-ae65-4e31-8a27-73c21c22247e	155d2133-c853-47d3-9301-e8fb05f0d272	1	56	Épisode 56			\N	\N	\N		t	2025-09-21 19:17:41.25585	2025-09-21 19:17:41.25585
21bd1b33-3102-42fe-b064-07bf6eeb8bba	155d2133-c853-47d3-9301-e8fb05f0d272	1	57	Épisode 57			\N	\N	\N		t	2025-09-21 19:17:41.388884	2025-09-21 19:17:41.388884
e336dde2-7cb3-4ca7-970f-2fa21009cc57	155d2133-c853-47d3-9301-e8fb05f0d272	1	58	Épisode 58			\N	\N	\N		t	2025-09-21 19:17:41.556945	2025-09-21 19:17:41.556945
44fbe2ce-4790-4690-8f20-7bea8c177c73	155d2133-c853-47d3-9301-e8fb05f0d272	1	59	Épisode 59			\N	\N	\N		t	2025-09-21 19:17:41.677414	2025-09-21 19:17:41.677414
fab9ae3e-4cd3-414f-87ac-ca91ab94af4e	155d2133-c853-47d3-9301-e8fb05f0d272	1	60	Épisode 60			\N	\N	\N		t	2025-09-21 19:17:41.818587	2025-09-21 19:17:41.818587
b659a1fb-3af7-441b-9ae6-58a8a32e026d	155d2133-c853-47d3-9301-e8fb05f0d272	1	61	Épisode 61			\N	\N	\N		t	2025-09-21 19:17:41.917871	2025-09-21 19:17:41.917871
80790639-0c17-4702-a51a-bfd2e0b44de3	155d2133-c853-47d3-9301-e8fb05f0d272	1	62	Épisode 62			\N	\N	\N		t	2025-09-21 19:17:42.294006	2025-09-21 19:17:42.294006
ba16e0cd-77e7-4e6a-a0a4-ce1f359df112	155d2133-c853-47d3-9301-e8fb05f0d272	1	63	Épisode 63			\N	\N	\N		t	2025-09-21 19:17:42.42371	2025-09-21 19:17:42.42371
276e08de-b522-4cf2-b156-6efbf582acb0	155d2133-c853-47d3-9301-e8fb05f0d272	1	64	Épisode 64			\N	\N	\N		t	2025-09-21 19:17:42.575066	2025-09-21 19:17:42.575066
1d6eba68-7d77-46d2-b57e-6df0726fddf0	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	2	Épisode 2			\N	\N	\N		t	2025-09-21 19:18:34.943942	2025-09-21 19:18:34.943942
b97bab83-4b5f-4487-80da-f4fbd20d6b34	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	3	Épisode 3			\N	\N	\N		t	2025-09-21 19:18:35.021596	2025-09-21 19:18:35.021596
319716d9-5cf7-4e70-99b2-bd90c8ea416a	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	4	Épisode 4			\N	\N	\N		t	2025-09-21 19:18:35.099663	2025-09-21 19:18:35.099663
feaf89fb-bb02-4ccf-9e86-ed8bfce6e755	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	5	Épisode 5			\N	\N	\N		t	2025-09-21 19:18:35.17225	2025-09-21 19:18:35.17225
ea6db2a1-636b-43b2-9e32-095e76ad1dbd	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	6	Épisode 6			\N	\N	\N		t	2025-09-21 19:18:35.254484	2025-09-21 19:18:35.254484
805a5d3e-7196-43a6-be71-5f4005a05620	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	7	Épisode 7			\N	\N	\N		t	2025-09-21 19:18:35.337211	2025-09-21 19:18:35.337211
5cc4e426-8f57-49d9-8ad8-240c298199fa	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	8	Épisode 8			\N	\N	\N		t	2025-09-21 19:18:35.420399	2025-09-21 19:18:35.420399
1c9bcebf-2679-4397-b919-253a9470f60d	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	9	Épisode 9			\N	\N	\N		t	2025-09-21 19:18:35.507247	2025-09-21 19:18:35.507247
d2bfbb29-39d6-4a05-80c3-a49d47a4ec15	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	10	Épisode 10			\N	\N	\N		t	2025-09-21 19:18:35.890404	2025-09-21 19:18:35.890404
1c76611f-00a3-42c8-bdbc-529db351aee3	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	11	Épisode 11			\N	\N	\N		t	2025-09-21 19:18:35.95504	2025-09-21 19:18:35.95504
a2a5706e-b037-4407-b318-2b35acc02a0a	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	12	Épisode 12			\N	\N	\N		t	2025-09-21 19:18:36.031513	2025-09-21 19:18:36.031513
cef3aba8-c19e-4fb4-b53d-718391fd8d5a	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	13	Épisode 13			\N	\N	\N		t	2025-09-21 19:18:36.096921	2025-09-21 19:18:36.096921
dc5716b7-c8cb-41a3-8bb2-646188418443	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	14	Épisode 14			\N	\N	\N		t	2025-09-21 19:18:36.172563	2025-09-21 19:18:36.172563
fb67d418-8fe9-452c-a259-609345b13934	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	15	Épisode 15			\N	\N	\N		t	2025-09-21 19:18:36.240056	2025-09-21 19:18:36.240056
9be5449e-c810-499a-b770-5ac728e325d3	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	16	Épisode 16			\N	\N	\N		t	2025-09-21 19:18:36.316472	2025-09-21 19:18:36.316472
ed239911-767c-4fe2-9170-bff0b626cb74	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	17	Épisode 17			\N	\N	\N		t	2025-09-21 19:18:36.381659	2025-09-21 19:18:36.381659
56391285-1160-475b-9b3f-a3212a690139	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	18	Épisode 18			\N	\N	\N		t	2025-09-21 19:18:36.452874	2025-09-21 19:18:36.452874
8a2ec7fd-6cf7-41e8-809b-578480800490	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	19	Épisode 19			\N	\N	\N		t	2025-09-21 19:18:36.51652	2025-09-21 19:18:36.51652
57c8fd49-f61a-4deb-b859-f03c7c423dc4	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	20	Épisode 20			\N	\N	\N		t	2025-09-21 19:18:36.863475	2025-09-21 19:18:36.863475
08acad0a-3305-4120-9ffe-b55317ec2d6a	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	21	Épisode 21			\N	\N	\N		t	2025-09-21 19:18:36.939528	2025-09-21 19:18:36.939528
f54fe654-2fcc-487f-a002-6764e1e5b119	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	22	Épisode 22			\N	\N	\N		t	2025-09-21 19:18:36.999428	2025-09-21 19:18:36.999428
9ddb8b97-deea-4c83-9f01-0d65b7f2aeb0	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	23	Épisode 23			\N	\N	\N		t	2025-09-21 19:18:37.067051	2025-09-21 19:18:37.067051
2b0bd8f7-e8de-45bb-9ed1-0c19fbf00c18	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	24	Épisode 24			\N	\N	\N		t	2025-09-21 19:18:37.135294	2025-09-21 19:18:37.135294
e49a4553-2785-40ea-9ad9-8f6d75c68295	b829530c-c029-425d-b265-9e8c56121f6a	1	1	Épisode 1		https:&amp;#x2F;&amp;#x2F;zupload.cc&amp;#x2F;embed&amp;#x2F;fgZsz3MDvik62DA	\N	\N	\N		t	2025-09-23 23:00:58.577372	2025-09-23 23:55:41.032
5849d493-b9ba-483c-9414-d57476130679	39a368d4-faab-4e40-a92f-c9e78a2cd629	1	1	Épisode 1			\N	\N	\N		t	2025-09-21 20:18:22.906819	2025-09-21 20:18:22.906819
e99ee559-1827-4493-8d50-8ad6ac6ef8c4	39a368d4-faab-4e40-a92f-c9e78a2cd629	1	2	Épisode 2			\N	\N	\N		t	2025-09-21 20:18:23.058934	2025-09-21 20:18:23.058934
cb67c035-4d0e-4580-8260-5fa45468ff45	39a368d4-faab-4e40-a92f-c9e78a2cd629	1	3	Épisode 3			\N	\N	\N		t	2025-09-21 20:18:23.201275	2025-09-21 20:18:23.201275
ce45b4ed-38b3-4648-9493-973c80face0c	39a368d4-faab-4e40-a92f-c9e78a2cd629	1	4	Épisode 4			\N	\N	\N		t	2025-09-21 20:18:23.344928	2025-09-21 20:18:23.344928
429a9915-8542-4afb-bfb1-dc5609e1bdfa	b829530c-c029-425d-b265-9e8c56121f6a	1	2	Épisode 2			\N	\N	\N		t	2025-09-23 23:00:58.713871	2025-09-23 23:00:58.713871
8893925b-8693-4a1c-8981-5ac29b73cc8d	b829530c-c029-425d-b265-9e8c56121f6a	1	3	Épisode 3			\N	\N	\N		t	2025-09-23 23:00:58.873858	2025-09-23 23:00:58.873858
94fb2e1a-fae1-4596-809b-50b24a74c703	a098de93-cc4e-4da3-b33c-6b31e7701526	1	2	Épisode 2			\N	\N	\N		t	2025-09-24 04:29:41.624699	2025-09-24 04:29:41.624699
6ee8605b-8bdb-461c-911b-85b014a176e4	a098de93-cc4e-4da3-b33c-6b31e7701526	1	3	Épisode 3			\N	\N	\N		t	2025-09-24 04:29:41.788066	2025-09-24 04:29:41.788066
6d6482cf-c231-48b4-badc-8b3a510edb42	a098de93-cc4e-4da3-b33c-6b31e7701526	1	4	Épisode 4			\N	\N	\N		t	2025-09-24 04:29:41.959491	2025-09-24 04:29:41.959491
e26fe05c-b1f2-4881-9821-058bb146d769	a098de93-cc4e-4da3-b33c-6b31e7701526	1	5	Épisode 5			\N	\N	\N		t	2025-09-24 04:29:42.130891	2025-09-24 04:29:42.130891
bb82b355-2f85-405e-aa9b-b0d12efb200e	a098de93-cc4e-4da3-b33c-6b31e7701526	1	6	Épisode 6			\N	\N	\N		t	2025-09-24 04:29:42.318435	2025-09-24 04:29:42.318435
78dcb533-1a18-4187-8cd2-bb9114998b13	a098de93-cc4e-4da3-b33c-6b31e7701526	1	7	Épisode 7			\N	\N	\N		t	2025-09-24 04:29:42.741935	2025-09-24 04:29:42.741935
97eef272-77be-42e1-a0b5-0e63c250e989	a098de93-cc4e-4da3-b33c-6b31e7701526	1	8	Épisode 8			\N	\N	\N		t	2025-09-24 04:29:42.917998	2025-09-24 04:29:42.917998
51cfc44a-0b5b-4f23-aa20-73e1de370467	a098de93-cc4e-4da3-b33c-6b31e7701526	1	9	Épisode 9			\N	\N	\N		t	2025-09-24 04:29:43.097805	2025-09-24 04:29:43.097805
0b42803f-911b-41a3-a7c5-6890b098cd79	a098de93-cc4e-4da3-b33c-6b31e7701526	1	10	Épisode 10			\N	\N	\N		t	2025-09-24 04:29:43.311826	2025-09-24 04:29:43.311826
da1549cd-049e-43d0-a897-85c79359f43b	a098de93-cc4e-4da3-b33c-6b31e7701526	1	11	Épisode 11			\N	\N	\N		t	2025-09-24 04:29:43.725177	2025-09-24 04:29:43.725177
fcddd73d-b14c-451a-8828-76488561ba5a	a098de93-cc4e-4da3-b33c-6b31e7701526	1	12	Épisode 12			\N	\N	\N		t	2025-09-24 04:29:43.89902	2025-09-24 04:29:43.89902
2e3f918a-c761-4ebb-a8fa-b503f1849e5a	a098de93-cc4e-4da3-b33c-6b31e7701526	1	13	Épisode 13			\N	\N	\N		t	2025-09-24 04:29:44.08136	2025-09-24 04:29:44.08136
5826a067-beb0-4f3e-8d6b-e56b469edcc9	a098de93-cc4e-4da3-b33c-6b31e7701526	1	1	Épisode 1		https:&amp;#x2F;&amp;#x2F;zupload.cc&amp;#x2F;embed&amp;#x2F;fgZsz3MDvik62DA	\N	\N	\N		t	2025-09-24 04:29:41.503458	2025-09-24 04:29:58.382
7092d68f-5d2d-4cc9-9a5a-19307f18c4b4	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	2	Épisode 2			\N	\N	\N		t	2025-09-24 04:34:04.775961	2025-09-24 04:34:04.775961
965450e1-5a07-411d-8e7c-3ee4e6c9c877	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	3	Épisode 3			\N	\N	\N		t	2025-09-24 04:34:04.946394	2025-09-24 04:34:04.946394
339dd228-6f9d-4802-a3d3-5e3d9f77953a	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	4	Épisode 4			\N	\N	\N		t	2025-09-24 04:34:05.137636	2025-09-24 04:34:05.137636
e8b9b808-9ff2-486a-a9d5-612d51e68bf1	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	5	Épisode 5			\N	\N	\N		t	2025-09-24 04:34:05.320834	2025-09-24 04:34:05.320834
0f036528-704d-4184-a9ac-efc4cc061ebb	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	6	Épisode 6			\N	\N	\N		t	2025-09-24 04:34:05.738073	2025-09-24 04:34:05.738073
0013fc7d-b830-45b3-bfd3-cd08ec8f5d2f	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	7	Épisode 7			\N	\N	\N		t	2025-09-24 04:34:05.917745	2025-09-24 04:34:05.917745
9715227d-475c-481f-ac9f-59752f3fcf80	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	8	Épisode 8			\N	\N	\N		t	2025-09-24 04:34:06.09487	2025-09-24 04:34:06.09487
cd191148-f556-487a-8f2d-4a55043901b1	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	9	Épisode 9			\N	\N	\N		t	2025-09-24 04:34:06.267884	2025-09-24 04:34:06.267884
007b5dd4-78f3-4f1c-9df7-716526a418e1	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	10	Épisode 10			\N	\N	\N		t	2025-09-24 04:34:06.456154	2025-09-24 04:34:06.456154
22c0d8f5-4504-44c5-b2fd-94f5cb800914	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	11	Épisode 11			\N	\N	\N		t	2025-09-24 04:34:06.879276	2025-09-24 04:34:06.879276
efef056a-3546-4e72-ad08-82544ebf7d67	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	12	Épisode 12			\N	\N	\N		t	2025-09-24 04:34:07.045183	2025-09-24 04:34:07.045183
4e324363-7732-4d05-8d5a-c8db5a6da4db	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	13	Épisode 13			\N	\N	\N		t	2025-09-24 04:34:07.222069	2025-09-24 04:34:07.222069
0eb545c5-a3c6-4757-8e3c-23f268d2bc25	4555dcc0-5bfd-49df-92eb-4c870c46a96a	1	1	Épisode 1		https:&amp;#x2F;&amp;#x2F;zupload.cc&amp;#x2F;embed&amp;#x2F;fgZsz3MDvik62DA	\N	\N	\N		t	2025-09-24 04:34:04.675253	2025-09-24 04:34:24.474
c2fc289c-f8dd-4613-9276-1b99d8af970c	e7ef87b0-cc27-463c-9d9c-6aab336be69e	1	1	Épisode 1		https:&amp;#x2F;&amp;#x2F;zupload.cc&amp;#x2F;embed&amp;#x2F;fgZsz3MDvik62DA	\N	\N	\N		t	2025-09-21 19:18:34.880896	2025-09-24 04:59:39.925
018cffea-0f28-4747-acc0-418daa3e6c28	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	2	Épisode 2			\N	\N	\N		t	2025-09-26 20:52:05.696465	2025-09-26 20:52:05.696465
6823d344-6fef-49d7-90db-ddba9513b4c4	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	3	Épisode 3			\N	\N	\N		t	2025-09-26 20:52:05.805389	2025-09-26 20:52:05.805389
c79ba57b-f70f-4f7b-af3d-6c6f55cc36a3	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	4	Épisode 4			\N	\N	\N		t	2025-09-26 20:52:05.911237	2025-09-26 20:52:05.911237
97207487-181d-42df-9a54-da17a5a53bd4	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	5	Épisode 5			\N	\N	\N		t	2025-09-26 20:52:06.019732	2025-09-26 20:52:06.019732
88d19061-1881-45f7-8178-7798ace90938	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	6	Épisode 6			\N	\N	\N		t	2025-09-26 20:52:06.12801	2025-09-26 20:52:06.12801
19a3ce9b-2ed7-4bba-9d32-8d0cd4cbe67c	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	7	Épisode 7			\N	\N	\N		t	2025-09-26 20:52:06.244324	2025-09-26 20:52:06.244324
d7c1c181-ff15-4ea3-a850-3dfc25dc31e1	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	8	Épisode 8			\N	\N	\N		t	2025-09-26 20:52:06.360629	2025-09-26 20:52:06.360629
17d00413-df89-4d47-a942-450921922e2c	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	9	Épisode 9			\N	\N	\N		t	2025-09-26 20:52:06.704383	2025-09-26 20:52:06.704383
93644535-866f-493b-8b5f-2f4f8ebd77e2	ec3f82ab-5d1d-4815-9b42-4a0dd19f4c8a	1	1	Épisode 1		https:&amp;#x2F;&amp;#x2F;zupload.cc&amp;#x2F;embed&amp;#x2F;RJqBMjsInhZXMPR	\N	\N	\N		t	2025-09-26 20:52:05.601384	2025-09-26 20:52:24.097
84c4d19c-c33b-485d-a3ac-5bf9fd6746f2	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	2	Épisode 2			\N	\N	\N		t	2025-09-26 21:17:23.625845	2025-09-26 21:17:23.625845
3ebde8ab-5738-4465-b5ab-5320a15b004f	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	3	Épisode 3			\N	\N	\N		t	2025-09-26 21:17:23.8283	2025-09-26 21:17:23.8283
4b7a2850-b75d-4a0d-8972-05b359d48fa4	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	4	Épisode 4			\N	\N	\N		t	2025-09-26 21:17:24.717461	2025-09-26 21:17:24.717461
2447aa10-56f1-465c-8534-664c13f1a944	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	5	Épisode 5			\N	\N	\N		t	2025-09-26 21:17:25.032823	2025-09-26 21:17:25.032823
2b227c9e-d57c-47ac-bdea-171a68fc6544	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	6	Épisode 6			\N	\N	\N		t	2025-09-26 21:17:25.93297	2025-09-26 21:17:25.93297
38a52f84-07b3-48fb-b83f-b285e32cf2f4	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	7	Épisode 7			\N	\N	\N		t	2025-09-26 21:17:26.753135	2025-09-26 21:17:26.753135
579e5a5b-9251-4230-aefb-6fe2da6fcb2e	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	8	Épisode 8			\N	\N	\N		t	2025-09-26 21:17:27.037583	2025-09-26 21:17:27.037583
a6b3a9c8-a41a-40fb-a808-3c4c415043d4	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	9	Épisode 9			\N	\N	\N		t	2025-09-26 21:17:27.785943	2025-09-26 21:17:27.785943
13875412-5953-4b5a-8607-5e22a0d21f58	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	10	Épisode 10			\N	\N	\N		t	2025-09-26 21:17:27.996605	2025-09-26 21:17:27.996605
d17796cc-116d-4c50-bfe4-8df27cb6c3b6	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	11	Épisode 11			\N	\N	\N		t	2025-09-26 21:17:28.779343	2025-09-26 21:17:28.779343
bdb969e6-9e85-4518-ac84-f318d30f3d55	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	12	Épisode 12			\N	\N	\N		t	2025-09-26 21:17:29.041197	2025-09-26 21:17:29.041197
cb579025-2f64-497c-b727-1ee3314991fb	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	13	Épisode 13			\N	\N	\N		t	2025-09-26 21:17:29.861944	2025-09-26 21:17:29.861944
04409dc2-0ff7-4814-bdb9-30e0a466756f	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	14	Épisode 14			\N	\N	\N		t	2025-09-26 21:17:30.102667	2025-09-26 21:17:30.102667
74c181f6-42da-42f3-aa86-c131bcfa2a85	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	15	Épisode 15			\N	\N	\N		t	2025-09-26 21:17:30.950374	2025-09-26 21:17:30.950374
8ae5aecf-b52d-41d3-a45b-b365346a8ca0	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	16	Épisode 16			\N	\N	\N		t	2025-09-26 21:17:31.206718	2025-09-26 21:17:31.206718
5a81174b-e343-496d-9b77-5559f0551dcf	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	17	Épisode 17			\N	\N	\N		t	2025-09-26 21:17:32.112587	2025-09-26 21:17:32.112587
134e9871-b863-4015-8e71-ac1debea43ef	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	18	Épisode 18			\N	\N	\N		t	2025-09-26 21:17:33.013573	2025-09-26 21:17:33.013573
b21a9318-4482-4f8e-a878-b7c9e5a94622	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	19	Épisode 19			\N	\N	\N		t	2025-09-26 21:17:33.247737	2025-09-26 21:17:33.247737
40475e29-97f0-4dc2-bb24-9e7f44b0ae9e	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	20	Épisode 20			\N	\N	\N		t	2025-09-26 21:17:35.18455	2025-09-26 21:17:35.18455
c19a500d-444d-4f9b-b682-70377b4c5b4b	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	21	Épisode 21			\N	\N	\N		t	2025-09-26 21:17:36.058053	2025-09-26 21:17:36.058053
ed49cd24-8e21-47ea-80a1-8b7e031aa8e3	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	22	Épisode 22			\N	\N	\N		t	2025-09-26 21:17:36.269567	2025-09-26 21:17:36.269567
2d1d7511-6764-4333-9b3d-dfbde310070b	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	23	Épisode 23			\N	\N	\N		t	2025-09-26 21:17:37.296267	2025-09-26 21:17:37.296267
b3d71867-5d32-4c35-a7c5-4e836da9f41a	a177ef9c-37a9-411b-a33a-4cbbe1081f56	1	1	Épisode 1		https:&amp;#x2F;&amp;#x2F;zupload.cc&amp;#x2F;embed&amp;#x2F;fgZsz3MDvik62DA	\N	\N	\N		t	2025-09-26 21:17:23.48867	2025-09-27 00:21:36.705
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.favorites (id, user_id, movie_id, movie_title, movie_poster, movie_genres, added_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, read, created_at) FROM stdin;
b9f5f56d-db98-45d2-b005-6a555a3a9eac	eab8fd4f-e397-4e82-856f-d8313e70b3f9	top 	du nouveau	info	t	2025-09-18 16:20:28.998338
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, user_id, subscription_id, amount, method, status, transaction_id, created_at, payment_data) FROM stdin;
4e728a32-b7ed-4eff-acfa-d498adf230bf	eab8fd4f-e397-4e82-856f-d8313e70b3f9	c6d28993-7780-49d4-9fe5-02df872f61f0	2000	lygos	pending	41350453-1fc1-46bc-9b56-9d82b141ea22	2025-09-21 16:08:40.380072	\N
2ef422d9-b183-4e91-ba97-ee17f50cc854	eab8fd4f-e397-4e82-856f-d8313e70b3f9	d5c1cf79-0f50-4036-bb36-cfcd7e7b38ed	3000	lygos	pending	694496b7-9324-4211-8a8d-58ea8b468f5e	2025-09-21 16:22:22.460249	\N
98b0f873-629b-44a9-9794-5dd28aca8904	eab8fd4f-e397-4e82-856f-d8313e70b3f9	3b978029-10ef-4822-aff4-f638893b9c87	5000	lygos	pending	dfca8842-e33b-4ae5-a75f-9e7078395184	2025-09-21 16:24:47.330486	\N
7ac77b7e-84b7-49c2-980e-423afbbb8f8a	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	5000	lygos	pending	\N	2025-09-21 17:39:22.001341	{"success": true, "paymentId": "c9401f89-54fe-4e4e-8c7e-0d768e6db1a6", "paymentLink": "https://pay.lygosapp.com/checkout/c9401f89-54fe-4e4e-8c7e-0d768e6db1a6"}
1201bb9d-c028-41eb-a172-5dabe6e52108	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	2000	lygos	pending	\N	2025-09-21 17:40:54.127077	{"success": true, "paymentId": "4e802bfc-29ce-4121-bad9-5f2c19f47a82", "paymentLink": "https://pay.lygosapp.com/checkout/4e802bfc-29ce-4121-bad9-5f2c19f47a82"}
06c178e7-3f58-48e3-bf84-e8bd497d24df	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	2000	lygos	pending	\N	2025-09-21 17:47:49.132019	{"success": true, "paymentId": "ccad8401-b1cb-47ac-936c-22849709e9ae", "paymentLink": "https://pay.lygosapp.com/checkout/ccad8401-b1cb-47ac-936c-22849709e9ae"}
bcbbfc22-1349-4c56-995e-703243b4a76d	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	2000	lygos	pending	\N	2025-09-21 17:53:27.736448	{"success": true, "paymentId": "f6e3a749-0c29-421e-95fc-4296244209aa", "paymentLink": "https://pay.lygosapp.com/checkout/f6e3a749-0c29-421e-95fc-4296244209aa"}
4f88969b-a69d-4755-9e3b-4636692591d4	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	2000	lygos	pending	\N	2025-09-21 18:19:36.399236	{"success": true, "paymentId": "b3eca54f-df40-4bad-bf15-dd3185c7d205", "paymentLink": "https://pay.lygosapp.com/checkout/b3eca54f-df40-4bad-bf15-dd3185c7d205"}
e5c871f8-a7d1-47f9-8ccb-dd63ea09e07c	e1b1f09b-ef35-4d22-be4c-85d71e3841d8	\N	5000	lygos	pending	\N	2025-09-24 00:38:05.071999	{"success": true, "paymentId": "ae49106c-c3a8-4358-b392-bbd81ff0d95f", "paymentLink": "https://pay.lygosapp.com/checkout/ae49106c-c3a8-4358-b392-bbd81ff0d95f"}
03d52fb8-38b6-4cff-83fd-c35e11e43348	e1b1f09b-ef35-4d22-be4c-85d71e3841d8	\N	5000	lygos	pending	\N	2025-09-24 05:12:16.603839	{"success": true, "paymentId": "8eb57552-4626-47aa-9e71-f5d0c4d5ad00", "paymentLink": "https://pay.lygosapp.com/checkout/8eb57552-4626-47aa-9e71-f5d0c4d5ad00"}
3d614d47-69ff-496e-b2f4-4af3fdfd8ff5	e1b1f09b-ef35-4d22-be4c-85d71e3841d8	\N	5000	lygos	pending	\N	2025-09-26 21:28:43.086326	{"success": true, "paymentId": "cb511786-da33-413c-b613-b1bcf9689fab", "paymentLink": "https://pay.lygosapp.com/checkout/cb511786-da33-413c-b613-b1bcf9689fab"}
d1bfb84b-1409-439c-84e7-438fba99a8f4	e1b1f09b-ef35-4d22-be4c-85d71e3841d8	\N	3000	lygos	pending	\N	2025-09-26 21:58:29.079864	{"success": true, "paymentId": "b0a9511a-800b-43ee-a9f3-df9648d67515", "paymentLink": "https://pay.lygosapp.com/checkout/b0a9511a-800b-43ee-a9f3-df9648d67515"}
882dbea8-3e20-43c1-8680-707dca4b5e4e	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	5000	paypal	pending	\N	2025-09-26 23:02:07.694422	{"planId": "vip", "orderId": "29623597650126023"}
b931d23b-02b9-45b6-8e1f-964c35ce134f	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	5000	paypal	pending	\N	2025-09-26 23:04:49.208638	{"planId": "vip", "orderId": "5N962221BF298421F"}
4b38c5ee-ab06-49f5-8281-a38bf773626b	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	5000	paypal	pending	\N	2025-09-26 23:08:07.117244	{"planId": "vip", "orderId": "5C53686577301625U"}
e41249e3-339f-47e0-803a-3b251de64fe7	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	5000	paypal	pending	\N	2025-09-26 23:14:39.99467	{"planId": "vip", "orderId": "03169523D31656829"}
8316aa29-f552-45ac-be5e-e16149fc38c2	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	5000	paypal	pending	\N	2025-09-26 23:17:26.362179	{"planId": "vip", "orderId": "60N089542P3145821"}
f90bdad1-2e77-4b2c-a565-215e17e0ef61	eab8fd4f-e397-4e82-856f-d8313e70b3f9	\N	5000	paypal	pending	\N	2025-09-26 23:21:31.246738	{"planId": "vip", "orderId": "9NV2241864095141C"}
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, user_id, plan_id, status, amount, payment_method, start_date, end_date, created_at) FROM stdin;
c6d28993-7780-49d4-9fe5-02df872f61f0	eab8fd4f-e397-4e82-856f-d8313e70b3f9	basic	active	2000	lygos	2025-09-21 16:08:40.335	2025-10-21 16:08:40.335	2025-09-21 16:08:40.342826
d5c1cf79-0f50-4036-bb36-cfcd7e7b38ed	eab8fd4f-e397-4e82-856f-d8313e70b3f9	standard	active	3000	lygos	2025-09-21 16:22:22.45	2025-10-21 16:22:22.45	2025-09-21 16:22:22.454089
3b978029-10ef-4822-aff4-f638893b9c87	eab8fd4f-e397-4e82-856f-d8313e70b3f9	vip	active	5000	lygos	2025-09-21 16:24:47.326	2025-10-21 16:24:47.326	2025-09-21 16:24:47.328582
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_preferences (id, user_id, preferred_genres, language, autoplay) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, session_start, session_end, is_active, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, role, created_at, banned) FROM stdin;
e1b1f09b-ef35-4d22-be4c-85d71e3841d8	admin	admin@streamkji.com	$2b$10$Al2y6hzquwm/XyS.cBftle4rxiCnEhE651CjMSRCtIsV4CsHtlPcO	admin	2025-09-15 04:07:50.682316	f
eab8fd4f-e397-4e82-856f-d8313e70b3f9	alex	esperantmbikayi98@gmail.com	$2b$10$7Q/nq1E5CxbgP.TWHzsiPeSJsKzyhj7L21VAiNeRZuqNj/IcfBVV6	user	2025-09-15 04:15:32.225095	f
28c2eb72-6412-40a3-be1b-d84781d96234	sam	ayaska00@gmail.com	$2b$10$/Xc.ojcjtvC8xTrgqYKLqubrKU92mjgbnz17NZjSXleAX5xfPQP3S	user	2025-09-17 01:21:02.385493	f
\.


--
-- Data for Name: view_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.view_tracking (id, user_id, movie_id, view_duration, view_date, session_id, created_at) FROM stdin;
\.


--
-- Data for Name: watch_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.watch_history (id, user_id, movie_id, movie_title, movie_poster, watched_at, watch_duration) FROM stdin;
\.


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: collections collections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collections
    ADD CONSTRAINT collections_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: view_tracking view_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_tracking
    ADD CONSTRAINT view_tracking_pkey PRIMARY KEY (id);


--
-- Name: watch_history watch_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watch_history
    ADD CONSTRAINT watch_history_pkey PRIMARY KEY (id);


--
-- Name: idx_comments_approved; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_approved ON public.comments USING btree (approved);


--
-- Name: idx_comments_content_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_content_id ON public.comments USING btree (content_id);


--
-- Name: idx_comments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_created_at ON public.comments USING btree (created_at DESC);


--
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);


--
-- Name: comments comments_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: episodes episodes_content_id_content_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_content_id_content_id_fk FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_subscription_id_subscriptions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_subscription_id_subscriptions_id_fk FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;


--
-- Name: payments payments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_preferences user_preferences_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: view_tracking view_tracking_session_id_user_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_tracking
    ADD CONSTRAINT view_tracking_session_id_user_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.user_sessions(id);


--
-- Name: view_tracking view_tracking_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.view_tracking
    ADD CONSTRAINT view_tracking_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: watch_history watch_history_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.watch_history
    ADD CONSTRAINT watch_history_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

